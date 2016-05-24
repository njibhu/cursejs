'use strict';

var messagesModules = require('./messages.js');
var notificationsEndpoint = require('../endpoints/notifications-v1.js');
var Events = require('./Events').Events;
var guidManager = require('../utils/guids.js');

/**
 * A Conversation is the text chat part of a channel.
 * @property {int}
 */
class Conversation {
    constructor(conversationID, conversationType, firstTimestamp, client){
        this.ID = conversationID;
        this.client = client;
        this.conversationType = conversationType;

        //Previously there was an array and an object keeping track of indexes, but since we can receive older messages
        //It's impossible to keep the order correct with an array.. So we drop the array and sort everything by their ID
        this.messageList = {};
        this._firstTimestampMessage = firstTimestamp;
    }

    _receivedMessageNotification(conversationMessageNotification){
        //Parse the new message and add it to the conversation messageList
        var parsedMessage = new messagesModules.Message(conversationMessageNotification, this);
        this.messageList[conversationMessageNotification.ServerID] = parsedMessage;

        //Check if this is a new message
        if(this._firstTimestampMessage <= conversationMessageNotification.Timestamp){
            //Emit the new message event
            this.client.emit(Events.MESSAGERECEIVED, parsedMessage);
        }

    }

    sendMessage(messageContent){
        var request = new notificationsEndpoint.ConversationMessageRequest(this.ID, "", guidManager.newGuid(), messageContent);
        this.client._wss.sendMessage(request);
    }

    _receiveMessageConfirmation(conversationMessageResponse){

    }
}

exports.Conversation = Conversation;
