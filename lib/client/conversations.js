'use strict';

var messagesModules = require('./messages.js');
var notificationsEndpoint = require('../endpoints/notifications-v1.js');
var Events = require('./Events').Events;
var guidManager = require('../utils/guids.js');

/**
 * A Conversation is the text chat part of a channel.
 */
class Conversation {
    constructor(conversationID, conversationType, firstTimestamp, client){
        const assert = require('assert');
        //We need the conversation to not exist already
        assert(client.conversations[conversationID] === undefined);
        client.conversations[conversationID] = this;

        this.ID = conversationID;
        this.client = client;
        this.conversationType = conversationType;

        //I'm laughing about deleting the comment that was there before, don't mind me.

        this.messageList = [];
        this._firstTimestampMessage = firstTimestamp;
    }

    _receivedMessageNotification(conversationMessageNotification){
        //Check if message doesn't already exist before creating it
        if(this.client.messages[conversationMessageNotification.ServerID] === undefined){
            var parsedMessage = new messagesModules.Message(conversationMessageNotification, this, this.client);
            this.messageList.push(parsedMessage);

            //Check if this is a new message
            if(this._firstTimestampMessage <= conversationMessageNotification.Timestamp){
                //Emit the new message event
                this.client.emit(Events.MESSAGERECEIVED, parsedMessage);
            }
        }
        //TODO: update exisiting messages and trigger corresponding event
    }

    //Need to make verification of sended message
    sendMessage(messageContent, callback){
        //Define an empty void if no callback specified
        if(callback === undefined){
            callback = _ => {};
        }
        var request = new notificationsEndpoint.ConversationMessageRequest(this.ID, "", guidManager.newGuid(), messageContent);
        this.client._wss.sendMessage(request);
        callback();
    }

    _receiveMessageConfirmation(conversationMessageResponse){

    }
}

exports.Conversation = Conversation;
