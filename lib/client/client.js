'use strict';

var EventEmitter = require('events').EventEmitter;
var Events = require('./events.js').Events;
var guidManager = require('../utils/guids.js');

var contactsEndpoint = require('../endpoints/contacts-v1.js');
var conversationsEndpoint = require('../endpoints/conversations-v1.js');
var loginEndpoint = require('../endpoints/logins-v1.js');
var groupsEndpoints = require('../endpoints/groups-v1.js');
var notificationsEndpoint = require('../endpoints/notifications-v1.js');
var sessionsEndpoint = require('../endpoints/sessions-v1.js');

var winston = require('winston');

var wss = require('./wss.js');
var serverModule = require('./servers.js');
var conversationsModule = require('./conversations.js');

/**
 * Cursejs lib client
 */
class Client extends EventEmitter {
    constructor(debugLevel){
        super();

        if(debugLevel === undefined){
            debugLevel = 'info';
        }

        //Change console settings for the logger
        winston.remove(winston.transports.Console)
        winston.add(winston.transports.Console, {
            level: debugLevel,
            prettyPrint: true,
            colorize: true,
            silent: false,
            timestamp: true
        });

        this._loginSession;
        this._wsSession;
        this._wss;
        this._loginRequest = {login: "", password: ""};
        this._connected = false;

        this.machineKey = guidManager.getMachineKey();
        this.token;
        this._tokenExpires;
        this._tokenRenewAfter;

        this.servers = {};
        this.channels = {};
        this.conversations = {};
        this.users = {};
        this.messages = {};

        this.clientID;

        this.serverList = [];
        this.friendList = []; //Please don't use them until we can manage friends at user level.

    }

    /**
     * IMPORTANT ! Login function will not get your client ready, if you don't know what you do please use the run function.
     * @param  {string}     login       Your Curse login name
     * @param  {string}     password    Your Curse login password
     * @param  {Function}   callback    Facultative arg, callback: (errors) => {};
     */
    login(login, password, callback){
        //Define an empty void if no callback specified
        if(callback === undefined){
            callback = _ => {};
        }

        this._loginRequest = new loginEndpoint.LoginRequest(login, password);
        var self = this; //Make object avalaible for callbacks

        loginEndpoint.login(this._loginRequest, function(errors, answer){
            if(errors === null){
                self._loginSession = answer.Session;
                self.token = self._loginSession['Token'];
                self._tokenExpires = self._loginSession['Expires'];
                self._tokenRenewAfter = self._loginSession['RenewAfter'];
                self.clientID = self._loginSession['UserID'];
                self._connected = true;

                //Renew session automatically
                self._renewSessionInterval = setInterval(self._renewSession, 604800000);

                winston.log('info', 'Client.login', 'Succesfully connected to REST Curse API.');
                self.emit(Events.CONNECTED);
                callback(null);
            } else {
                winston.log('error', 'Client.login:', 'Status:', errors);
                callback(errors);
            }
        });
    }

    /**
     * Renew the token for all the rest api request before the rest session exprire (renew is automatically scheduled)
     */
    _renewSession(){
        var renewRequest = new loginEndpoint.RenewTokenResponseContract(self.token, self._tokenExpires, self._tokenRenewAfter);
        loginEndpoint.loginRenew(renewRequest, self.token, function(errors, answer){
            if(errors === null){
                self.token = answer.Token;
                self._tokenExpires = answer.Expires;
                self._tokenRenewAfter = answer.RenewAfter;
            } else {
                winston.log('error', 'Client._renewSession', 'Couldn\'t renew the token will try again next time', errors);
            }
        });
    }

    /**
     * Fill up the serverList and friendList properties (erasing existing, DO NOT use it to update the server infos)
     * (The erasing thing is not true anymore but it's still not a good idea to do so, we'll get some change later..).
     */
    _loadContacts(callback){
        //Define an empty void if no callback specified
        if(callback === undefined){
            callback = _ => {};
        }

        var self = this;
        contactsEndpoint.contacts(this.token, function(errors, answer){
            if(errors === null){
                answer['Groups'].forEach(function(item){
                    //Take only servers
                    if(item.GroupType == groupsEndpoints.GroupType.Large){
                        //Check that server is not already existing
                        if(self.servers[item.GroupID] === undefined){
                            var server = new serverModule.Server(item, self);
                            self.serverList.push(server);
                        }
                    }
                });

                self.friendList = answer['Friends']; //Thoses friends are not useable yet (who needs friends ?)
                callback(null);
            } else {
                callback(errors);
            }
        });

    }

    get username(){
        if(this._connected){
            return this._loginSession.Username;
        } else {
            return undefined;
        }
    }

    /**
     * Get a sessionID ready from Curse to be able to open the notification websocket
     */
    _initWSSession(){
        var sessionRequest = new sessionsEndpoint.SessionsRequest(this.machineKey);
        var self = this;
        sessionsEndpoint.sessions(sessionRequest, this._loginSession['Token'], function(errors, answer){
            if(errors === null){
                self._wsSession = answer;
                winston.log('info', 'Client._initWSSession:', 'Received websocket session authorization');
                self.emit(Events.WS_AUTHORIZED);
            } else {
                winston.log('error', 'Client._initWSSession:', errors);
            }
        });
    }

    /**
     * Open the notification websocket to the Curse notification server, careful, we need the ws session ready before,
     * for that use the function _initWSSession()
     */
    _openWS(){
        this._wss = new wss.NotificationsConnection(this);
        this._wss.starts();
    }

    /**
     * All-in-one function that makes the client to work seemlessly
     * @param  {string} login    Your Curse login name
     * @param  {string} password Your Curse login password
     */
    run(login, password){
        var self = this;
        var ready = false;

        this.on(Events.CONNECTED, function(){
            self._loadContacts(function(errors){
                if(errors === null){
                    self._initWSSession();
                }
                else {
                    winston.log('error', 'Client.run', 'Cannot get server informations', errors);
                }
            });

        });

        //Start the websocket as soon as we have the session authorization for websockets
        this.on(Events.WS_AUTHORIZED, self._openWS);

        this.on(Events.WS_CONNECTED, function(){
            if(!ready){
                //Call Ready event when Websocket connection is established
                self.emit(Events.READY);
                ready = true;
            }
        })

        this.login(login, password);
    }

    /**
     * Send a message in a conversation
     * @param  {Conversation}   conversation    Conversation
     * @param  {string}         content         Message content
     * @param  {Function}       callback        Facultative arg, callback: () => {};
     */
    sendMessage(conversation, content, callback){
        //Define an empty void if no callback specified
        if(callback === undefined){
            callback = _ => {};
        }
        conversation.sendMessage(content, callback);
    }

}

exports.Client = Client;
