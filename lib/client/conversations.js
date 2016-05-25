'use strict';

var messagesModules = require('./messages.js');
var notificationsEndpoint = require('../endpoints/notifications-v1.js');
var conversationsEndpoint = require('../endpoints/conversations-v1.js');
var Events = require('./Events').Events;
var guidManager = require('../utils/guids.js');

const assert = require('assert');

/**
 * A Conversation is the text chat part of a channel.
 */
class Conversation {
    constructor(conversationID, conversationType, firstTimestamp, client){
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

            //Check if this is a new message (Thanks again Adamar \o/)
            if(conversationMessageNotification.NotificationType ==
                conversationsEndpoint.ConversationNotificationType.Normal){
                //Emit the new message event
                this.client.emit(Events.MESSAGERECEIVED, parsedMessage);
            }
        }
        //TODO: update exisiting messages and trigger corresponding event (Message.update())
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
        //TODO: get the conversationMessage response from wss and call the sendMessage callback when confirmation received
    }

    /**
     * Edit the content of a specified message
     * @param  {string}   newContent Text of the new message
     * @param  {Message}  message    Message object
     * @param  {Function} callback   Callback with errors as parameters, will be null if everything is fine
     */
    editMessage(messageContent, message, callback){
        message.editContent(messageContent, callback);
    }

    /**
     * Delete a specified message
     * @param  {Message}  message    Message object
     * @param  {Function} callback   Callback with errors as parameters, will be null if everything is fine
     */
    deleteMessage(message, callback){
        message.deleteMessage(callback);
    }
}

exports.Conversation = Conversation;
