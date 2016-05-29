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

        this.contentHistory = [];
        this.contentHistory.push(new MessageFrame(conversationMessageNotification.SenderName,
            conversationMessageNotification.SenderID, conversationMessageNotification.Timestamp,
            conversationMessageNotification.Body));
        this.conversation = conversation;
        this.ID = conversationMessageNotification.ServerID;
        this.senderName = conversationMessageNotification.SenderName;
        this.senderID = conversationMessageNotification.SenderID;
        this.timestamp = conversationMessageNotification.Timestamp;
        this.likes = {LikeCount: conversationMessageNotification.LikeCount,
            LikeUserIDs: conversationMessageNotification.LikeUserIDs,
            LikeUsernames: conversationMessageNotification.LikeUsernames}
        this.isDeleted = false;

        //Link to our users
        if(client.users[conversationMessageNotification.SenderID] != undefined){
            this.sender = client.users[conversationMessageNotification.SenderID];
        } else {
            this.sender = new usersModule.User(conversationMessageNotification.SenderID,
                conversationMessageNotification.SenderName, client);
        }
        this.sender._newMessage(this);
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
            //TODO: Message.likes (int), Message.LikesUsers[] (User)
            this.likes = {LikeCount: conversationMessageNotification.LikeCount,
                LikeUserIDs: conversationMessageNotification.LikeUserIDs,
                LikeUsernames: conversationMessageNotification.LikeUsernames};
        }
        else {
            this.isDeleted = true;
        }
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
                    winston.log('error', 'Message.editContent', 'Cannot delete message', self.ID);
                    callback(errors);
                }
                else {
                    callback(null);
                }
            });
        //TODO: To check, do we need to remove the message from the message list or do anything else?
    }

    reply(content, callback){
        this.conversation.sendMessage(content, callback);
    }

}

exports.Message = Message;
