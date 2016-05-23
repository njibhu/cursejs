'use strict';

var messagesModules = require('./messages.js');
var notificationsEndpoint = require('../endpoints/notifications-v1.js');
var Events = require('./Events').Events;
var guidManager = require('../core/guids.js');

/**
 * A Conversation is the text chat part of a channel.
 */
class Conversation {
    constructor(conversationID, firstTimestamp, client){
        this.ID = conversationID;
        this._client = client; //This is internally used to be able to send new message at lower level.

        //I'm using an array and not an object because I want to keep the order of the messages here, but it may change
        //someday when I'll improve it
        this.messageHistory = [];
        this._messagesIndex = {};
        this._firstTimestampMessage = firstTimestamp;
    }

    //TODO: handle user list too
    receivedMessageNotification(conversationMessageNotification){
        //Check if this is a new message
        if(this._messagesIndex[conversationMessageNotification.ClientID] == undefined &&
        this._firstTimestampMessage<=conversationMessageNotification.Timestamp){
            var parsedMessage = new messagesModules.Message(conversationMessageNotification, this);
            var index = this.messageHistory.push(parsedMessage) - 1;
            this._messagesIndex[conversationMessageNotification.ClientID] = index;

            //Emit the new message event
            this._client.emit(Events.MESSAGERECEIVED, parsedMessage);
        }
        else if(this._firstTimestampMessage<=conversationMessageNotification.Timestamp){
            //Handle modification notification for known messages

            //TEMPORARY DISABLED because full bugged
            //var index = this._messagesIndex[conversationMessageNotification.ServerID]
            //this.messageHistory[index].update(conversationMessageNotification);
        } else {
            //TODO: Handle older messages
        }
    }

    sendMessage(messageContent){
        var request = new notificationsEndpoint.ConversationMessageRequest(this.ID, "", guidManager.newGuid(), messageContent);
        this._client._wss.sendMessage(request);
    }

    receiveMessageConfirmation(conversationMessageResponse){

    }
}

exports.Conversation = Conversation;
