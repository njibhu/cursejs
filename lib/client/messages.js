'use strict';

const assert = require('assert');

var conversationsModule = require('./conversations.js');
var conversationsEndpoint = require('../endpoints/conversations-v1.js');
var usersModule = require('./users.js');
var Events = require('../client/events.js').Events;

var winston = require('winston');

/**
 * A Message notification is a type of
 */
class MessageNotification {
    constructor(conversationMessageNotification, conversation, client){
        var self = this;

        //For debugging purposes
        this._conversationMessageNotifiation = conversationMessageNotification;

        this.client = client;
        this.conversation = conversation;
        this.ID = conversationMessageNotification.ServerID;
        this.content = conversationMessageNotification.Body;
        this.notificationType = conversationMessageNotification.NotificationType;
        this.senderName = conversationMessageNotification.SenderName;
        this.senderID = conversationMessageNotification.SenderID;
        this.serverTimestamp = conversationMessageNotification.Timestamp;
        this.likes = conversationMessageNotification.LikeCount;
        this.likeUserIDs = conversationMessageNotification.LikeUserIDs;
        this.isDeleted = (conversationMessageNotification.NotificationType
            == conversationsEndpoint.ConversationNotificationType.Deleted);

        //Link to our users
        if(client.users.has(conversationMessageNotification.SenderID)){
            this.sender = client.users.get(conversationMessageNotification.SenderID);
        } else {
            this.sender = new usersModule.User(conversationMessageNotification.SenderID, client);
        }
    }

    /**
     * Edit the content of the message
     * @param  {string}   newContent Text of the new message
     * @param  {Function} callback   Callback with errors as parameters, will be null if everything is fine
     */
    editContent(newContent, callback){
        //Define an empty void if no callback specified
        if(callback === undefined){
            callback = _ => {};
        }
        var self = this;
        var req = new conversationsEndpoint.ConversationEditMessageRequest(newContent, []);
        conversationsEndpoint.conversationsEdit(this.conversation.ID, this.ID,
            this.serverTimestamp, req, this.conversation.client.token, function(errors){
                if(errors != undefined){
                    winston.log('error', 'Message.editContent', 'Cannot edit message', self.ID);
                    callback(errors);
                }
                else {
                    callback(null);
                }
            });
    }

    /**
     * Delete the message from the conversation
     * @param  {Function} callback   Callback with errors as parameters, will be null if everything is fine
     */
    deleteMessage(callback){
        //Define an empty void if no callback specified
        if(callback === undefined){
            callback = _ => {};
        }
        var self = this;
        conversationsEndpoint.conversationsDelete(this.conversation.ID, this.ID,
            this.timestamp, this.conversation.client.token, function(errors){
                if(errors != undefined){
                    winston.log('error', 'Message.deleteContent', 'Cannot delete message', self.ID);
                    callback(errors);
                }
                else {
                    callback(null);
                }
            });
    }

    reply(content, callback){
        this.conversation.sendMessage(content, callback);
    }

}

exports.MessageNotification = MessageNotification;
exports.NotificationType = conversationsEndpoint.ConversationNotificationType;
