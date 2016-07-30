'use strict';

var WebSocket = require('ws');
var winston = require('winston');

var sessionsEndpoint = require('../endpoints/sessions-v1.js');
var notificationsEndpoint = require('../endpoints/notifications-v1.js');
var ConversationsModule = require('./conversations.js');

var Events = require('./events.js').Events;

//Notifier class
class Notifier {
    constructor(client){
        this.client = client;

        this._session;
        this._ws;
        this._authenticated = false;
        this._pingInterval;
        this._ready = false;

        this._timeGapToServer = 0;
        this._lastPingTimestamp = null;
        this._lastPingAnswer = null;
        this._messagesCallback = new Map();
    }

    start(){
        var self = this;
        this._getsession(function(errors){
            if(errors == null){
                self._startWS();
            }
            else {
                winston.log('error', 'Notifier.start', 'Cannot start Notifier:', errors);
            }
        });
    }

    //get a session authorisation
    _getsession(callback){
        var sessionRequest = new sessionsEndpoint.SessionsRequest(this.client.machineKey);

        var self = this;
        sessionsEndpoint.sessions(sessionRequest, this.client.token, function(errors, answer){
            if(errors === null){
                if(answer['MachineKey'] != self.client.machineKey){
                    self.client.machineKey = answer['MachineKey'];
                }
                self._session = answer;
                winston.log('info', 'Notifier._getsession:', 'Session ready');
                callback(null);
            } else {
                winston.log('error', 'Notifier._getsession:', errors);
                callback(errors);
            }
        });
    }

    reset(){
        winston.log('info', 'Notifier.reset', 'Resetting notifier connection')
        this.close();
        this.start();
    }

    close(){
        try {
            this._ws.close();
        }
        finally {
            delete this._ws;
        }
        this._authenticated = false;
        if(this._pingInterval != undefined){
            clearInterval(this._pingInterval);
            this._pingInterval = undefined;
        }
        this._timeGapToServer = 0;
        this._lastPingTimestamp = null;
        this._lastPingAnswer = null;
    }

    _startWS(){
        var self = this;
        this._ws = new WebSocket(notificationsEndpoint.host);
        winston.log('info', 'Notifier._startWS:', 'Websocket initialized.');

        var connectionRequest = new notificationsEndpoint.JoinRequest(this._session['MachineKey'],
            this._session['User']['UserID'], this._session['SessionID']);

        this._ws.on('open', function(){
            self.sendWSFrame(notificationsEndpoint.TypeID.JoinRequest, connectionRequest);
        });

        this._ws.on('message', function(data, flags){
            self._handleWSFrame(data, flags);
        });
    }

    _handleWSFrame(data, flags){
        var answer = JSON.parse(data);

        // PRE CONNECTION packet handling
        if (this._authenticated == false){
            var self = this;
            if(answer.TypeID == notificationsEndpoint.TypeID.JoinResponse){
                //Check if server accept the join request
                if(answer.Body.Status == notificationsEndpoint.JoinStatus.Successful){
                    this._authenticated = true;
                    this._timeGapToServer = Date.now() - Date.parse(answer.Body.ServerTime);

                    winston.log('info', 'Notifier._handleWSFrame:', 'Connected to server.');

                    //Start pinging every 5 seconds
                    this._pingInterval = setInterval(function(){
                        self._ping();
                    }, 5000);

                    //This goes in the end, was messing up with some tests with the ready event
                    this._ready = true;
                    this.client._ready();
                }
                else {
                    winston.log('error', 'Notifier._handleWSFrame:', 'Connection failed:', answer.Body.Status);
                    this.close();
                    this.client.close();
                }
            }
        }
        // POST CONNECTION packet handling:
        else {
            //> If ConversationMessageNotification (Message notification)
            if(answer.TypeID == notificationsEndpoint.TypeID.ConversationMessageNotification){
                winston.log('silly', 'Notifier._handleWSFrame:', 'ConversationMessageNotification received');

                //If the client doesn't handle the conversation yet, create it
                if(this.client.conversations.has(answer.Body.ConversationID) == false){
                    this.client.conversations.set(answer.Body.ConversationID, new ConversationsModule.Conversation(
                        answer.Body.ConversationID, answer.Body.ConversationType, this.client));
                }

                //TODO: /!\ not in schedule for 1.1 /!\
                //It's possible using answer.Body.ConversationType to know if it's a group or a private conversation
                //so it's theorically possible to create server and channels corresponding on message event
                //BUT! It requires small groups support first because ConversationType doesn't make the difference
                //And other solutions would only be dirty hacks that we don't want here

                //Give the message to a Conversation to handle it at higher level
                this.client.conversations.get(answer.Body.ConversationID)._receivedMessageNotification(answer.Body);
            }

            //> If Handshake (ping)
            if(answer.TypeID == notificationsEndpoint.TypeID.Handshake){
                this._lastPingAnswer = Date.now();
                winston.log('silly', 'Notifier._handleWSFrame:', 'Ping received, latency:', this._lastPingAnswer-this._lastPingTimestamp);
            }

            //> If ConversationMessageResponse (validation of a sent message)
            if(answer.TypeID == notificationsEndpoint.TypeID.ConversationMessageResponse){
                winston.log('silly', 'Notifier._handleWSFrame:', 'Received a conversation response');
                if(this._messagesCallback.has(answer.Body.ClientID)){
                    //TODO: Handle a timeout for no message confirmation.
                    this._messagesCallback.get(answer.Body.ClientID)(null);
                    this._messagesCallback.delete(answer.Body.ClientID);
                }
            }
        }
    }

    _ping(){
        if(this._lastPingAnswer-this._lastPingTimestamp > 5000){
            winston.log('warn', 'Notifier._ping', 'Didn\'t received the last ping from server.');
        }
        this._lastPingTimestamp = Date.now();
        this.sendWSFrame(notificationsEndpoint.TypeID.Handshake, {"Signal": true});
    }

    sendWSFrame(typeID, content){
        var request = JSON.stringify({"TypeID":typeID, "Body": content});
        var self = this;
        this._ws.send(request, function(error){
            if(error != undefined){
                winston.log('warn', 'Notifier.sendWSFrame', 'Cannot send new frames');
                winston.log('debug', error);
                self.reset();
            }
        });
    }

    sendMessage(conversationMessageRequest){
        this.sendWSFrame(notificationsEndpoint.TypeID.ConversationMessageRequest, conversationMessageRequest);
    }
}

exports.Notifier = Notifier;
