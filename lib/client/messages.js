'use strict';

const assert = require('assert');

var conversationsModule = require('./conversations.js');
var conversationsEndpoint = require('../endpoints/conversations-v1.js');
var usersModule = require('./users.js');
var Events = require('../client/events.js').Events;

var winston = require('winston');

class MessageFrame{
    constructor(username, userid, timestamp, content){
        this.username = username;
        this.userID = userid;
        this.timestamp = timestamp;
        this.content = content;
    }
}

/**
 * A Message is a text message
 */
class Message {
    constructor(conversationMessageNotification, conversation, client){
        //We need the conversation to not exist already
        assert(client.messages[conversationMessageNotification.ServerID] === undefined);
        client.messages[conversationMessageNotification.ServerID] = this;

        var self = this;

        this.contentHistory = [];
        this.contentHistory.push(new MessageFrame(conversationMessageNotification.SenderName,
            conversationMessageNotification.SenderID, conversationMessageNotification.Timestamp,
            conversationMessageNotification.Body));

        this.client = client;
        this.conversation = conversation;
        this.ID = conversationMessageNotification.ServerID;
        this.senderName = conversationMessageNotification.SenderName;
        this.senderID = conversationMessageNotification.SenderID;
        this.timestamp = conversationMessageNotification.Timestamp;
        this.likes = conversationMessageNotification.LikeCount;
        this.likeUserIDs = conversationMessageNotification.LikeUserIDs;
        this.isDeleted = (conversationMessageNotification.NotificationType
            == conversationsEndpoint.ConversationNotificationType.Deleted);

        //Link to our users
        if(client.users.has(conversationMessageNotification.SenderID)){
            this.sender = client.users.get(conversationMessageNotification.SenderID);
        } else {
            this.sender = new usersModule.User(conversationMessageNotification.SenderID,
                conversationMessageNotification.SenderName, client);
        }

        //Used to clean memory when message didn't get any notification in 24hours
        this._cleanTimeout = setTimeout(function(){
            self._selfCleaner();
        }, 86400000);

    }

    /**
     * This function is used internally to update a message from notification websocket
     * @param  {object} conversationMessageNotification ConversationMessageNotification object
     */
    update(conversationMessageNotification){
        if(conversationMessageNotification.NotificationType == conversationsEndpoint.ConversationNotificationType.Edited){
            this.contentHistory.push(new MessageFrame(conversationMessageNotification.EditedUsername,
                conversationMessageNotification.EditedUserID, conversationMessageNotification.EditedTimestamp,
                conversationMessageNotification.Body));
        }
        else if(conversationMessageNotification.NotificationType == conversationsEndpoint.ConversationNotificationType.Liked){
            this.likes = conversationMessageNotification.LikeCount;
            this.likeUserIDs = conversationMessageNotification.LikeUserIDs;
        }
        else if(conversationMessageNotification.NotificationType == conversationsEndpoint.ConversationNotificationType.Deleted){
            this.isDeleted = true;
        }

        clearTimeout(this._updateTimestamp);
        this._cleanTimeout = setTimeout(function(){
            self._selfCleaner();
        }, 86400000);
    }

    get content(){
        if(this.isDeleted == false){
            return this.contentHistory[this.contentHistory.length -1].content;
        }
        else {
            return null;
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
            this.timestamp, req, this.conversation.client.token, function(errors){
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

    /**
     * Internally clean the message list, messages are removed from indexes after 24h
     * and garbage collector take care of freeing the memory if not used anywhere else
     */
    _selfCleaner(){
        //Clean conversation messageList + client messages map
        this.conversation.messageList.splice(this.conversation.messageList.indexOf(this), 1);
        this.client.messages.delete(this.ID);
    }

}

exports.Message = Message;
