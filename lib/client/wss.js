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
    constructor(connectionRequest, client){
        this._ws = null;
        this.client = client;
        this._connectionRequest = connectionRequest;
        this._authenticated = false;
        this._lastPingTimestamp = null;
        this._lastPingAnswer = null;
    }

    starts(){
        var self = this;
        this._ws = new WebSocket(ProtocolV1.host);
        winston.log('info', 'NotificationsConnection.open:', 'Websocket initialized.');

        this._ws.on('open', function(){
            self.sendFrame(ProtocolV1.TypeID.JoinRequest, self._connectionRequest);
        });

        this._ws.on('message', function(data, flags){
            self.handleFrame(data, flags);
        });
    }

    close(){
        this._ws.close();
    }

    sendMessage(conversationMessageRequest){
        this.sendFrame(ProtocolV1.TypeID.ConversationMessageRequest, conversationMessageRequest);
    }

    handleFrame(data, flags){
        if (!this._authenticated){
            var answer = JSON.parse(data);

            //TODO: support server timing
            if(answer.TypeID == ProtocolV1.TypeID.JoinResponse){
                if(answer.Body.Status == 1){
                    this._authenticated = true;
                    winston.log('info', 'NotificationsConnection.open:', 'Connected to server.');
                    this.client.emit(Events.WS_CONNECTED);
                    var self = this;
                    //Start pinging every 5 seconds
                    setInterval(function(){
                        if(self._lastPingAnswer-self._lastPingTimestamp > 5000){
                            winston.log('warn', 'Didn\'t received the last ping from server.');
                        }
                        self.ping();
                    }, 5000);
                }
                else {
                    winston.log('error', 'NotificationsConnection.open:', 'Invalid connection status:', answer.Body.Status);
                    this.close();
                }
            }
        } else {
            var answer = JSON.parse(data);
            //Check if the frame notification is a new message
            if(answer.TypeID == ProtocolV1.TypeID.ConversationMessageNotification){

                //Does the client handle this conversation yet ?
                if(this.client.conversations[answer.Body.ConversationID] == undefined){
                    var timestamp = answer.Body.Timestamp;
                    //TODO: Use a timestamp jitter when server time is supported, for now it is 5min
                    if(timestamp-300000 < Date.now()){
                        timestamp = Date.now()-300000;
                    }
                    this.client.conversations[answer.Body.ConversationID] = new ConversationsModule.Conversation(
                        answer.Body.ConversationID, answer.Body.ConversationType, timestamp, this.client);
                }

                //Give the message to a Conversation to handle it at higher level
                this.client.conversations[answer.Body.ConversationID]._receivedMessageNotification(answer.Body);
            }
            if(answer.TypeID == ProtocolV1.TypeID.Handshake){
                this._lastPingAnswer = Date.now();
                winston.log('debug', 'Ping received', 'Latency', this._lastPingAnswer-this._lastPingTimestamp);
            }

        }
    }
    ping(){
        this._lastPingTimestamp = Date.now();
        this.sendFrame(ProtocolV1.TypeID.Handshake, {"Signal": true});
    }

    sendFrame(typeID, content){
        var request = JSON.stringify({"TypeID":typeID, "Body": content});
        this._ws.send(request);
    }
}

exports.NotificationsConnection = NotificationsConnection;
