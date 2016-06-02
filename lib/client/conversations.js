'use strict';

var messagesModules = require('./messages.js');
var notificationsEndpoint = require('../endpoints/notifications-v1.js');
var conversationsEndpoint = require('../endpoints/conversations-v1.js');
var Events = require('./events.js').Events;
var guidManager = require('../utils/guids.js');

const assert = require('assert');

/**
 * A Conversation is the text chat part of a channel.
 */
class Conversation {
    constructor(conversationID, conversationType, client){
        //We need the conversation to not exist already
        assert(client.conversations[conversationID] === undefined);
        client.conversations[conversationID] = this;

        this.ID = conversationID;
        this.client = client;
        this.conversationType = conversationType;

        //This property doesn't guarantee that it is a channel, you will still need to check
        this.channel = this.client.channels[conversationID];

        this.messageList = [];
    }

    _receivedMessageNotification(conversationMessageNotification){
        //Check if message doesn't already exist before creating it
        if(this.client.messages[conversationMessageNotification.ServerID] === undefined){
            var parsedMessage = new messagesModules.Message(conversationMessageNotification, this, this.client);
            this.messageList.push(parsedMessage);

            //Update server nickname if this is channel
            if(this.channel != undefined){
                this.channel.server.nicknames[parsedMessage.senderID] = parsedMessage.senderName;
            }
        } else {
            this.client.messages[conversationMessageNotification.ServerID].update(conversationMessageNotification);
        }

        //Check if this is a new message (Thanks again Adamar \o/)
        if(conversationMessageNotification.NotificationType ==
            conversationsEndpoint.ConversationNotificationType.Normal){
            //Emit the new message event
            this.client.emit(Events.MESSAGERECEIVED, this.client.messages[conversationMessageNotification.ServerID]);
        }
        else if(conversationMessageNotification.NotificationType ==
            conversationsEndpoint.ConversationNotificationType.Edited){
                //Emit the new message event
                this.client.emit(Events.MESSAGEEDITED, this.client.messages[conversationMessageNotification.ServerID]);
        }
        else if(conversationMessageNotification.NotificationType ==
            conversationsEndpoint.ConversationNotificationType.Liked){
                //Emit the new message event
                this.client.emit(Events.MESSAGELIKED, this.client.messages[conversationMessageNotification.ServerID]);
        }
        else if(conversationMessageNotification.NotificationType ==
            conversationsEndpoint.ConversationNotificationType.Deleted){
                //Emit the new message event
                this.client.emit(Events.MESSAGEDELETED, this.client.messages[conversationMessageNotification.ServerID]);
        }
    }

    //Need to make verification of sended message
    sendMessage(messageContent, callback){
        //Define an empty void if no callback specified
        if(callback === undefined){
            callback = _ => {};
        }
        var request = new notificationsEndpoint.ConversationMessageRequest(this.ID, "", guidManager.newGuid(), messageContent);
        this.client._notifier.sendMessage(request);
        callback();
    }

    _receiveMessageConfirmation(conversationMessageResponse){
        //TODO: get the conversationMessage response from notifier
        // and call the sendMessage callback when confirmation received
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
