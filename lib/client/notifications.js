'use strict';

var WebSocket = require('ws');
var winston = require('winston');

var sessionsEndpoint = require('../endpoints/sessions-v1.js');
var notificationsEndpoint = require('../endpoints/notifications-v1.js');
var ConversationsModule = require('./conversations.js');

var Events = require('./events.js').Events;

/**
 * The notifier class
 */
class Notifier {
    constructor(client){
        this.client = client;

        this._session;
        this._ws;
        this._authenticated;
        this._pingInterval;

        this._timeGapToServer = 0;
        this._lastPingTimestamp = null;
        this._lastPingAnswer = null;
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
        if (!this._authenticated){
            var self = this;
            if(answer.TypeID == notificationsEndpoint.TypeID.JoinResponse){
                //Check if server accept the join request
                if(answer.Body.Status == notificationsEndpoint.JoinStatus.Successful){
                    this._authenticated = true;
                    this._timeGapToServer = Date.parse(answer.Body.ServerTime) - Date.now();

                    winston.log('info', 'Notifier._handleWSFrame:', 'Connected to server.');
                    //Emit client NOTIFIER_CONNECTED
                    this.client.emit(Events.NOTIFIER_CONNECTED);

                    //Start pinging every 5 seconds
                    this._pingInterval = setInterval(function(){
                        self._ping();
                    }, 5000);
                }
                else {
                    winston.log('error', 'Notifier._handleWSFrame:', 'Connection failed:', answer.Body.Status);
                    this.close();
                }
            }
        }
        // POST CONNECTION packet handling:
        else {
            //> ConversationMessageNotification (Message notification)
            if(answer.TypeID == notificationsEndpoint.TypeID.ConversationMessageNotification){

                //Does the client handle this conversation yet ? If not create the conversation
                if(this.client.conversations[answer.Body.ConversationID] == undefined){
                    this.client.conversations[answer.Body.ConversationID] = new ConversationsModule.Conversation(
                        answer.Body.ConversationID, answer.Body.ConversationType, this.client);
                }

                //Give the message to a Conversation to handle it at higher level
                this.client.conversations[answer.Body.ConversationID]._receivedMessageNotification(answer.Body);
            }

            //> Handshake (ping)
            if(answer.TypeID == notificationsEndpoint.TypeID.Handshake){
                this._lastPingAnswer = Date.now();
                winston.log('silly', 'Ping received', 'Latency', this._lastPingAnswer-this._lastPingTimestamp);
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

}

exports.Notifier = Notifier;
