'use strict';

var EventEmitter = require('events').EventEmitter;
var Events = require('./events.js').Events;
var guidManager = require('../utils/guids.js');

var loginEndpoint = require('../endpoints/logins-v1.js');
var sessionsEndpoint = require('../endpoints/sessions-v1.js');
var contactsEndpoint = require('../endpoints/contacts-v1.js');
var notificationsEndpoint = require('../endpoints/notifications-v1.js');

var winston = require('winston');

var wss = require('./wss.js');
var serverModule = require('./servers.js');

/**
 * Cursejs lib client
 */
class Client extends EventEmitter {
    constructor(){
        super();

        this._loginSession;
        this._wsSession;
        this._wss;
        this._loginRequest = {login: "", password: ""};
        this._connected = false;

        this.machineKey = guidManager.getMachineKey();
        this.token;
        this.serverList = {};
        this.friendList = {}; //Please don't use them until we can manage friends at user level.
        this.conversationList = {};

    }

    /**
     * IMPORTANT ! Login function will not get your client ready, if you don't know what you do please use the run function.
     * @param  {string} login    Your Curse login name
     * @param  {string} password Your Curse login password
     */
    login(login, password){
        this._loginRequest = new loginEndpoint.LoginRequest(login, password);
        var self = this; //Make object avalaible for callbacks

        loginEndpoint.login(this._loginRequest, function(errors, answer){
            if(errors === null){
                self._loginSession = answer.Session;
                self.token = self._loginSession['Token'];
                self._connected = true;

                //TODO: setTimeout(answer.RenewAfter-time, self.renewSession);

                winston.log('info', 'Client.login', 'Succesfully connected to REST Curse API.');
                self.emit(Events.CONNECTED);
            } else {
                winston.log('error', 'Client.login:', 'Status:', errors);
            }
        });
    }

    /**
     * Renew the token for all the rest api request before the rest session exprire (renew is automatically scheduled)
     */
    _renewSession(){

    }

    /**
     * Fill up the serverList and friendList properties (erasing existing, DO NOT use it to update the server infos).
     */
    _loadContacts(){
        var self = this;
        contactsEndpoint.contacts(this.token, function(errors, answer){
            if(errors != undefined){
                throw {"Unable to fetch contacts": errors};
            } else{
                self.serverList = serverModule.generateServerListFromGroupArray(answer['Groups'], self);
                self.friendList = answer['Friends']; //Thoses friends are not useable yet (who needs friends ?)
                self.emit(Events.CONTACTSLOADED);
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
        var joinreq = new notificationsEndpoint.JoinRequest(this.machineKey, this._wsSession['User']['UserID'], this._wsSession['SessionID']);
        this._wss = new wss.NotificationsConnection(joinreq, this);
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
        var contactsLoaded = false;

        //Small function that will check everytime a component is ready if everything is
        //before calling the ready emiter
        function isReady(){
            if(contactsLoaded && !ready){
                ready = true;
                self.emit(Events.READY);
            } else {
                return false;
            }
        }

        this.on(Events.CONTACTSLOADED, function(){
            contactsLoaded = true;
            isReady();
        });

        this.on(Events.CONNECTED, function(){
            self._initWSSession();
            self._loadContacts();
        });

        this.on(Events.WS_AUTHORIZED, self._openWS);

        this.login(login, password);
    }
}

exports.Client = Client;
