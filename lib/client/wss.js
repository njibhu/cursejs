'use strict';

var EventEmitter = require('events').EventEmitter;
var WebSocket = require('ws');
var ProtocolV1 = require('../endpoints/notifications-v1.js');
var Events = require('./events.js').Events;
var ConversationsModule = require('./conversations.js');
//var Message = require('./message.js').Message;


//TODO: PING handshake

/**
 * NotificationsConnection is a low level implementation of the curse websocket notification endpoint.
 */
class NotificationsConnection {
    constructor(connectionRequest, client){
        this._ws = null;
        this._client = client;
        this._connectionRequest = connectionRequest;
        this._authenticated = false;
    }

    starts(){
        var self = this;
        this._ws = new WebSocket(ProtocolV1.host);
        console.log("INFO", "NotificationsConnection.open:", "Websocket initialized.");

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
                    console.log("INFO", "NotificationsConnection.open:", "Connected to server.");
                }
                else {
                    console.log("ERR", "NotificationsConnection.open:", "Invalid connection status:", answer.Body.Status);
                    this.close();
                }
            }
        } else {
            var answer = JSON.parse(data);
            //Check if the frame notification is a new message
            if(answer.TypeID == ProtocolV1.TypeID.ConversationMessageNotification){
                //Does the client handle this conversation yet ?
                if(this._client.conversationList[answer.Body.ConversationID] == undefined){
                    var timestamp = answer.Body.Timestamp;
                    //TODO: Use a timestamp jitter when server time is supported, for now it is 5min
                    if(timestamp-300000 < Date.now()){
                        timestamp = Date.now()-300000;
                    }
                    this._client.conversationList[answer.Body.ConversationID] = new ConversationsModule.Conversation(
                        answer.Body.ConversationID, timestamp, this._client);
                }

                //Give it to a Conversation to handle it at higher level
                this._client.conversationList[answer.Body.ConversationID].receivedMessageNotification(answer.Body);
            }
        }
    }

    sendFrame(typeID, content){
        var request = JSON.stringify({"TypeID":typeID, "Body": content});
        this._ws.send(request);
    }
}

exports.NotificationsConnection = NotificationsConnection;
