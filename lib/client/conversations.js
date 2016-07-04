'use strict';

var winston = require('winston');

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
        assert(client.conversations.has(conversationID) == false);
        client.conversations.set(conversationID, this);

        this.ID = conversationID;
        this.client = client;
        this.conversationType = conversationType;

        //This property doesn't guarantee that it is a channel, you will still need to check
        this.channel = this.client.channels.get(conversationID);
    }

    getHistory(pageSize, endTimestamp, callback){
        conversationsEndpoint.history(this.ID, endTimestamp, pageSize, this.client.token, callback);
    }

    //callback({message:{}, break()})
    genHistoryIterator(callback){

    }

    _receivedMessageNotification(conversationMessageNotification){
        var parsedMessage = new messagesModules.MessageNotification(conversationMessageNotification, this, this.client);

        if(conversationMessageNotification.NotificationType ==
            conversationsEndpoint.ConversationNotificationType.Normal){
            //Debugging
            winston.log('silly', 'Conversation._receivedMessageNotification', 'New message');
            //+Emit the new message event
            this.client.emit(Events.MESSAGERECEIVED, parsedMessage);
        }
        else if(conversationMessageNotification.NotificationType ==
            conversationsEndpoint.ConversationNotificationType.Edited){
                //Debugging
                winston.log('silly', 'Conversation._receivedMessageNotification', 'Message edited');
                //+Emit the edited message event
                this.client.emit(Events.MESSAGEEDITED, parsedMessage);
        }
        else if(conversationMessageNotification.NotificationType ==
            conversationsEndpoint.ConversationNotificationType.Liked){
                //Debugging
                winston.log('silly', 'Conversation._receivedMessageNotification', 'Message liked');
                //+Emit the liked message event
                this.client.emit(Events.MESSAGELIKED, parsedMessage);
        }
        else if(conversationMessageNotification.NotificationType ==
            conversationsEndpoint.ConversationNotificationType.Deleted){
                //Debugging
                winston.log('silly', 'Conversation._receivedMessageNotification', 'Message deleted');
                //+Emit the deleted message event
                this.client.emit(Events.MESSAGEDELETED, parsedMessage);
        }
    }

    //Need to make verification of sended message
    sendMessage(messageContent, callback){
        //Define an empty void if no callback specified
        if(callback === undefined){
            callback = _ => {};
        }
        var msgClientID = guidManager.newGuid();
        var request = new notificationsEndpoint.ConversationMessageRequest(this.ID, "", msgClientID, messageContent);
        this.client._notifier.sendMessage(request);
        //Register callback to a map
        this.client._notifier._messagesCallback.set(msgClientID, callback);
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
