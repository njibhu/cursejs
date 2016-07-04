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

var serverModule = require('./servers.js');
var conversationsModule = require('./conversations.js');
var notificationsModule = require('./notifications.js');

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
        this._notifier;
        this._loginRequest = {login: "", password: ""};
        this._connected = false;

        this.machineKey = guidManager.getMachineKey();
        this.token;
        this._tokenExpires;
        this._tokenRenewAfter;
        this._timeGapToServer;
        this._readySent = false;

        this.servers = new Map();
        this.channels = new Map();
        this.conversations = new Map();
        this.users = new Map();

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
                self._loginSession = answer['Session'];
                self.token = answer['Session']['Token'];
                self._tokenExpires = answer['Session']['Expires'];
                self._tokenRenewAfter = answer['Session']['RenewAfter'];
                self.clientID = answer['Session']['UserID'];
                // ! ABOUT timeGapToServer: careful with the signs +/- you're using
                self._timeGapToServer = Date.now() - answer['Timestamp'];
                self._connected = true;

                //Renew session automatically
                self._renewSessionTimeout = setTimeout(self._renewSession,
                    (self._tokenRenewAfter - Date.now()) + self._timeGapToServer);

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
        clearTimeout(this._renewSessionTimeout);
        var self = this;
        loginEndpoint.loginRenew(this.token, function(errors, answer){
            if(errors === null){
                var data = answer.content;
                winston.log('debug', 'Client._renewSession', 'Successful token renew');
                self.token = data.Token;
                self._tokenExpires = data.Expires;
                self._tokenRenewAfter = data.RenewAfter;
                self._renewSessionTimeout = setTimeout(self._renewSession,
                    (self._tokenRenewAfter - Date.now()) + self._timeGapToServer);
            } else {
                winston.log('error', 'Client._renewSession', 'Couldn\'t renew the token will try again in 5minutes', errors);
                self._renewSessionTimeout = setTimeout(self._renewSession, 300000);
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
                for (let groupAnswer of answer['Groups']){
                    //Take only servers
                    if(groupAnswer.GroupType == groupsEndpoints.GroupType.Large){
                        //Check that server is not already existing
                        if(self.servers.has(groupAnswer.GroupID) == false){
                            var server = new serverModule.Server(groupAnswer, self);
                            self.serverList.push(server);
                        }
                    }
                }

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
     * All-in-one function that makes the client to work seemlessly
     * @param  {string} login    Your Curse login name
     * @param  {string} password Your Curse login password
     */
    run(login, password){
        var self = this;

        this._notifier = new notificationsModule.Notifier(this);

        this.on(Events.CONNECTED, function(){
            self._loadContacts(function(errors){
                if(errors === null){
                    self._notifier.start();
                }
                else {
                    winston.log('error', 'Client.run', 'Cannot get contacts', errors);
                }
            });

        });

        this.login(login, password);
    }

    _ready(){
        var serversReady = true;
        //check servers are ready
        for (let server of this.servers.values()){
            if(!server._ready){
                serversReady = false;
                break;
            }
        }

        // Everything is ready
        if(this._notifier._ready && serversReady && !this._readySent){
            this._readySent = true;
            this.emit(Events.READY);
        }
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
