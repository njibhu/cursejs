'use strict';

var EventEmitter = require('events').EventEmitter;

var WebSocket = require('ws');
var winston = require('winston');

var ProtocolV1 = require('../endpoints/notifications-v1.js');
var Events = require('./events.js').Events;
var ConversationsModule = require('./conversations.js');


//TODO: PING handshake

/**
 * NotificationsConnection is a low level implementation of the curse websocket notification endpoint.
 */
class NotificationsConnection {
    constructor(client){
        this.client = client;
        this.setup();
    }

    setup(){
        if(this.pingInterval != undefined){
            clearInterval(this.pingInterval);
        }
        this._ws = null;
        this._authenticated = false;
        this._lastPingTimestamp = null;
        this._lastPingAnswer = null;
    }

    starts(){
        var self = this;
        this._ws = new WebSocket(ProtocolV1.host);
        winston.log('info', 'NotificationsConnection.open:', 'Websocket initialized.');

        var connectionRequest = new ProtocolV1.JoinRequest(this.client.machineKey,
            this.client._wsSession['User']['UserID'], this.client._wsSession['SessionID']);

        self._connectionRequestLog = connectionRequest;

        this._ws.on('open', function(){
            self.sendFrame(ProtocolV1.TypeID.JoinRequest, connectionRequest);
        });

        this._ws.on('message', function(data, flags){
            self.handleFrame(data, flags);
        });
    }

    reset(){
        winston.log('info', 'NotificationsConnection.reset', 'Trying to reset the connection');
        self.client._initWSSession();
        self.setup();
        self.starts();
    }

    close(){
        this._ws.close();
        this.setup();
    }

    sendMessage(conversationMessageRequest){
        this.sendFrame(ProtocolV1.TypeID.ConversationMessageRequest, conversationMessageRequest);
    }

    handleFrame(data, flags){
        if (!this._authenticated){
            var answer = JSON.parse(data);

            //TODO: support server timing
            if(answer.TypeID == ProtocolV1.TypeID.JoinResponse){
                if(answer.Body.Status == ProtocolV1.JoinStatus.Successful){
                    this._authenticated = true;
                    winston.log('info', 'NotificationsConnection.open:', 'Connected to server.');
                    this.client.emit(Events.WS_CONNECTED);
                    var self = this;
                    //Start pinging every 5 seconds
                    this.pingInterval = setInterval(function(){
                        if(self._lastPingAnswer-self._lastPingTimestamp > 5000){
                            winston.log('warn', 'Didn\'t received the last ping from server.');
                        }
                        self.ping();
                    }, 5000);
                }
                else {
                    winston.log('error', 'NotificationsConnection.open:', 'Invalid connection status:', answer.Body.Status);
                    //Fix for Curse session error
                    if(answer.Body.Status == ProtocolV1.JoinStatus.InvalidSessionID){
                        this.reset();
                    }
                    winston.log('debug', this._connectionRequestLog);
                    this.close();
                }
            }
        } else {
            var answer = JSON.parse(data);
            //Check if the frame notification is a new message
            if(answer.TypeID == ProtocolV1.TypeID.ConversationMessageNotification){

                //Does the client handle this conversation yet ? If not create the conversation
                if(this.client.conversations[answer.Body.ConversationID] == undefined){
                    this.client.conversations[answer.Body.ConversationID] = new ConversationsModule.Conversation(
                        answer.Body.ConversationID, answer.Body.ConversationType, this.client);
                }

                //Give the message to a Conversation to handle it at higher level
                this.client.conversations[answer.Body.ConversationID]._receivedMessageNotification(answer.Body);
            }
            if(answer.TypeID == ProtocolV1.TypeID.Handshake){
                this._lastPingAnswer = Date.now();
                winston.log('silly', 'Ping received', 'Latency', this._lastPingAnswer-this._lastPingTimestamp);
            }

        }
    }
    ping(){
        this._lastPingTimestamp = Date.now();
        this.sendFrame(ProtocolV1.TypeID.Handshake, {"Signal": true});
    }

    sendFrame(typeID, content){
        var request = JSON.stringify({"TypeID":typeID, "Body": content});
        var self = this;
        this._ws.send(request, function(error){
            if(error != undefined){
                winston.log('warn', 'NotificationsConnection.sendFrame', 'Lost connection with peer', error);
                self.reset();
            }
        });
    }
}

exports.NotificationsConnection = NotificationsConnection;
