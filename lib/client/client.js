'use strict';

var EventEmitter = require('events').EventEmitter;
var Events = require('./events.js').Events;
var guidManager = require('../core/guids.js');

var loginEndpoint = require('../endpoints/logins-v1.js');
var sessionsEndpoint = require('../endpoints/sessions-v1.js');
var contactsEndpoint = require('../endpoints/contacts-v1.js');
var notificationsEndpoint = require('../endpoints/notifications-v1.js');

var wss = require('./wss.js');
var serverModule = require('./servers.js');

/**
 * Cursejs lib client
 */
class Client extends EventEmitter {
    constructor(){
        super();

        // Private variables
        this._loginSession;
        this._wsSession;
        this._wss;
        this._machineKey = guidManager.getMachineKey();
        this._loginRequest = {login: "", password: ""};
        this._connected = false;

        this.serverList = {};
        this.friendList = {}; //Please don't use them until we can manage friends at user level.
        this.conversationList = {};

    }

    /**
     * IMPORTANT ! Login function will not get your client ready, if you don't know what you do please use the run function.
     * @param  {string} login    Your Curse login name
     * @param  {string} password Your Curse login password
     * @return {undefined}  Function doesn't return anything.
     */
    login(login, password){
        this._loginRequest = new loginEndpoint.LoginRequest(login, password);
        var self = this; //Make object avalaible for callbacks

        loginEndpoint.login(this._loginRequest, function(answer){
            if(answer.Status == 1){
                self._loginSession = answer.Session;
                self._connected = true;

                //TODO: setTimeout(answer.RenewAfter-time, self.renewSession);

                console.log("INFO", "Client.login:", "Connected");
                self.emit(Events.CONNECTED);
            } else {
                console.log("ERR", "Client.login:", "Status:", answer.Status);
                console.log("ERR", "Client.login:", "StatusMessage:", answer.StatusMessage);
            }
        });
    }

    /**
     * Renew the token for all the rest api request before the rest session exprire (renew is automatically scheduled)
     * @return {undefined} This function doesn't return anything
     */
    renewSession(){

    }

    /**
     * Fill up the serverList and friendList properties (erasing existing, DO NOT use it to update the server infos).
     * @return {undefined} This function doesn't return anything
     */
    loadContacts(){
        var self = this;
        contactsEndpoint.contacts(this._loginSession['Token'], function(answer){
            self.serverList = serverModule.generateServerListFromGroupArray(answer['Groups'], self);
            self.friendList = answer['Friends']; //Thoses friends are not useable yet (who needs friends ?)
            self.emit(Events.CONTACTSLOADED);
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
     * @return {undefined} Does not return anything
     */
    initWSSession(){
        var sessionRequest = new sessionsEndpoint.SessionsRequest(this._machineKey);
        var self = this;
        sessionsEndpoint.sessions(sessionRequest, this._loginSession['Token'], function(answer){
            if(typeof(answer['error']) == 'undefined'){
                self._wsSession = answer;
                console.log("INFO", "Client.initWSSession:", "Received websocket session authorization");
                self.emit(Events.WS_AUTHORIZED);
            }
            else {
                console.log("ERR", "Client.initWSSession:", "Status:", answer['error']);
            }
        });
    }

    /**
     * Open the notification websocket to the Curse notification server, careful, we need the ws session ready before,
     * for that use the function initWSSession()
     * @return {undefined} Does not return anything.
     */
    openWS(){
        var self = this;
        var joinreq = new notificationsEndpoint.JoinRequest(this._machineKey, this._wsSession['User']['UserID'], this._wsSession['SessionID']);
        this._wss = new wss.NotificationsConnection(joinreq, self);
        this._wss.starts();
    }

    /**
     * All-in-one function that makes the client to work seemlessly
     * @param  {string} login    Your Curse login name
     * @param  {string} password Your Curse login password
     * @return {undefined} Does not return anything.
     */
    run(login, password){
        var self = this;
        var ready = false;
        var contactsLoaded = false;
        var allServersReady = false;
        var serversReady = [];

        //Small function that will check everytime a component is ready if everything is
        //before calling the ready emiter
        function isReady(){
            if(contactsLoaded && allServersReady && !ready){
                ready = true;
                self.emit(Events.READY);
            } else {
                return false;
            }
        }
        this.on(Events.SERVERLOADED, function(server){
            serversReady.push(server);
            if(serversReady.length == Object.keys(self.serverList).length){
                allServersReady = true;
            }
            isReady();
        });

        this.on(Events.CONTACTSLOADED, function(){
            contactsLoaded = true;
            isReady();
        });

        this.on(Events.CONNECTED, function(){
            self.initWSSession();
            self.loadContacts();
        });

        this.on(Events.WS_AUTHORIZED, self.openWS);

        this.login(login, password);
    }
}

exports.Client = Client;
