'use strict';

var WebSocket = require('ws');
var winston = require('winston');

var sessionsEndpoint = require('../endpoints/sessions-v1.js');
var notificationsEndpoint = require('../endpoints/notifications-v1.js');
var conversationsEndpoint = require('../endpoints/conversations-v1.js');
var ConversationsModule = require('./conversations.js');
var guidManager = require('../utils/guids.js');

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

        this._messageQueue = [];
        this._throttleWaiter;
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

        //Messages in queue should be kept in queue and sent if notifier is restarted
        //But clearing the message in queue to avoid a crash when safeTimeout is called
        if(this._messageQueue.length > 0){
            clearTimeout(this._messageQueue[0].safeTimeout);
            this._messageQueue.shift();
        }
        if(this._throttleWaiter != undefined){
            clearTimeout(this._throttleWaiter);
        }
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

                //Give the message to a Conversation to handle it at higher level
                this.client.conversations.get(answer.Body.ConversationID)._receivedMessageNotification(answer.Body);
            }

            //> If Handshake (ping)
            if(answer.TypeID == notificationsEndpoint.TypeID.Handshake){
                this._lastPingAnswer = Date.now();
                winston.log('silly', 'Notifier._handleWSFrame:', 'Ping received, latency:', this._lastPingAnswer-this._lastPingTimestamp);
            }

            //> If ConversationMessageResponse (handling message queue + callback for message)
            if(answer.TypeID == notificationsEndpoint.TypeID.ConversationMessageResponse){
                winston.log('silly', 'Notifier._handleWSFrame:', 'Received a conversation response');
                this._handleMessageResponse(answer.Body);
            }

            //> Server update
            if(answer.TypeID == notificationsEndpoint.TypeID.GroupChangeNotification){
                winston.log('silly', 'Notifier._handleWSFrame:', 'Received GroupChange Notification');
                switch(answer.Body.ChangeType){
                    // case notificationsEndpoint.GroupChangeType.AddUsers:
                    //     break;
                    // case notificationsEndpoint.GroupChangeType.RemoveUsers:
                    //     break;
                    // case notificationsEndpoint.GroupChangeType.UpdateUsers:
                    //     break;
                    case notificationsEndpoint.GroupChangeType.ChangeInfo:
                        winston.log('debug', 'GroupChangeNotification ChangeInfo received');
                        //Fetch the server object corresponding to the notification then update its properties
                        var server = this.client.servers.get(answer.Body.Group.GroupID);
                        server._updateFromInformations(answer.Body.Group); //TODO: Not in schedule yet, compare to existing and return modified
                        this.client.emit(Events.SERVERCHANGE, server);
                        break;
                    default:
                        winston.log('debug', 'Unsupported GroupChangeNotification:', JSON.stringify(answer.Body));
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

    sendMessage(conversationMessageRequest, callback){
        this._messageQueue.push({
            frame: conversationMessageRequest,
            callback: callback,
            sent: false,
            safeTimeout: undefined,
            retry: false
        });
        this._queueNext();
    }

    _handleMessageResponse(response){
        //Handle response of message and send callback
        if(response.ClientID == this._messageQueue[0].frame.ClientID){
            clearTimeout(this._messageQueue[0].safeTimeout);
            // If Status is successful
            if(response.Status == 4){
                this._messageQueue[0].callback(null);
                this._messageQueue.shift();
                this._queueNext();
            }
            //If the message get throttled for the first time, we wait 100ms and try to resend it
            else if(response.Status == 5 && !this._messageQueue[0].retry){
                winston.log('debug', 'Notifier._handleMessageResponse:', 'Backend throttled message. Handling over.');
                var self = this;
                this._throttleWaiter = setTimeout(function(){
                    this._throttleWaiter = undefined;
                    self._messageQueue[0].frame.ClientID = guidManager.newGuid();
                    self._messageQueue[0].sent = false;
                    self._queueNext();
                }, 100);
            }
            //Else transmit callback with error
            else {
                this._messageQueue[0].callback(response.Status);
                this._messageQueue.shift();
                this._queueNext();
            }
        }
    }

    _queueNext(){
        //Check if there are message in queue, can be called without any when received confirmation of a lonely message
        if(this._messageQueue.length > 0){
            //Get the first message in queue
            var message = this._messageQueue[0];
            if(message.sent == false){
		        //Using websocket to send messages is now deprecated by curse
                //So we are using the new conversations endpoint
		        var messageRequest = new conversationsEndpoint.ConversationCreateMessageRequest(
                    this._session['MachineKey'], message.frame.AttachmentID, message.frame.ClientID, message.frame.Message, 0);
		        conversationsEndpoint.conversationsSend(message.frame.ConversationID, messageRequest, this.client.token, () => {});

                //this.sendWSFrame(notificationsEndpoint.TypeID.ConversationMessageRequest, message.frame);
                message.sent = true;
                //Safe function to not let notifier lock itself without unconfirmed messages
                var self = this;
                message.safeTimeout = setTimeout(function(){
                    if(self._messageQueue[0] == message){
                        winston.log('error', 'Notifier:', 'Text message lost by backend', message.frame.ClientID);
                        message.callback("Message lost by backend");
                        self._messageQueue.shift();
                        self._queueNext();
                    }
                }, 5000);
            }
        }
    }
}

exports.Notifier = Notifier;
