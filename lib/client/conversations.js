'use strict';

var winston = require('winston');

var messagesModules = require('./messages.js');
var notificationsEndpoint = require('../endpoints/notifications-v1.js');
var conversationsEndpoint = require('../endpoints/conversations-v1.js');
var Events = require('./events.js').Events;
var guidManager = require('../utils/guids.js');

const assert = require('assert');

/**
 * @class Conversation
 * @description The **Conversation** class represent a conversation between one or multiple person on Curse.
   It can be a small group conversation, a server channel conversation, a server private conversation,
   a friend conversation, or a adhoc conversation. If it's a server channel conversation then the channel
   property is set to the corresponding channel.
 * @property    {string}    ID                  Curse UUID of the current [Conversation]{@link Conversation}.
   This ID is shared with the corresponding [Channel]{@link Channel} if it's a server channel conversation.
 * @property    {Client}    client              [Client]{@link Client} object used to create this [Conversation]{@link Conversation} instance.
 * @property    {number}    conversationType    Specify the type of the current [Conversation]{@link Conversation} following the
   conversations-v1 ConversationType endpoint definition. Friendship = 0, Group = 1, AdHoc = 2, GroupPrivateConversation = 3.
 * @property    {Channel}   channel             Corresponding [Channel]{@link Channel} object of the current [Conversation]{@link Conversation} **if
   and only if the [Conversation]{@link Conversation} is a conversation of an existing channel and not a private conversation**.
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

    /**
     * @description  Iterate through all the past messages of this conversation. From now to the first message.
     * @param  {Function}       callback        callback: (errors, message, done) => {}.
     * * **errors** is **null** or **undefined** when everything happens correctly.
     * * **message** is a [MessageNotification]{@link MessageNotification} of a past message.
     * * **done** is a **boolean**, **true** when there is no more messages to iterate over.
     * * To stop the iteration return false inside the callback
     *
     * @example
     * myChannel.everyHistoryMessages(function(errors, message, done){
     *     if(errors == null && !done){
     *
     *         //We can handle message history like message notifications
     *         console.log(message.serverTimestamp, message.senderName, message.content);
     *
     *         if(message.content == "stop"){
     *         //This will stop the scrolling when a message with the content stop is found
     *             return false;
     *         }
     *     }
     * });
     */
    everyHistoryMessages(callback){
        var self = this;
        var endTimestamp = 0;
        var messageArray = [];
        var continueLoop = true;
        function requestCallback(){
            conversationsEndpoint.history(self.ID, endTimestamp, 100, self.client.token, function(errors, answer){
                if(errors === null){
                    messageArray = answer.content;
                    //What if endpoints return empty array ?
                    if(messageArray.length == 0){
                        continueLoop = false;
                        callback(null, undefined, true);
                    } else {
                        endTimestamp = answer.content[answer.content.length - 1].Timestamp;
                        //While locale
                        while(messageArray.length > 0 && continueLoop){
                            var message = new messagesModules.MessageNotification(messageArray.shift(), self, self.client);
                            //Stop loop when user return false
                            continueLoop = callback(null, message, false) != false;
                        }
                        if(messageArray.length == 0 && continueLoop){
                            requestCallback();
                        }
                    }
                }
                else{
                    callback(errors, undefined, true);
                }
            });
        }
        requestCallback();
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

    /**
     * @description send a message to the current conversation.
     * @param  {string}   messageContent    Text content of the message.
     * @param  {Function} callback          Facultative arg, callback: (errors) => {}.
       This function can take an argument errors that is null or undefined when function ends correctly.
     */
    sendMessage(messageContent, callback){
        //Define an empty void if no callback specified
        if(callback === undefined){
            callback = _ => {};
        }
        var msgClientID = guidManager.newGuid();
        var request = new notificationsEndpoint.ConversationMessageRequest(this.ID, "", msgClientID, messageContent);
        this.client._notifier.sendMessage(request, callback);
    }

    /**
     * Edit the content of a specified message
     * @param  {string}   newContent Text of the new message
     * @param  {Message}  message    Message object
     * @param  {Function} callback   Facultative arg, callback: (errors) => {}.
       This function can take an argument errors that is null or undefined when function ends correctly.
     */
    editMessage(messageContent, message, callback){
        message.editContent(messageContent, callback);
    }

    /**
     * Delete a specified message
     * @param  {Message}  message    Message object
     * @param  {Function} callback   Facultative arg, callback: (errors) => {}.
       This function can take an argument errors that is null or undefined when function ends correctly.
     */
    deleteMessage(message, callback){
        message.deleteMessage(callback);
    }
}

exports.Conversation = Conversation;
