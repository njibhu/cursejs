'use strict';

const assert = require('assert');

var conversationsModule = require('./conversations.js');
var conversationsEndpoint = require('../endpoints/conversations-v1.js');
var usersModule = require('./users.js');
var Events = require('../client/events.js').Events;

var winston = require('winston');

/**
 * @description This is a notification of a existing message describing it.
 * @property    {Client}        client              [Client]{@link Client} object used to create this [MessageNotification]{@link MessageNotification} instance.
 * @property    {Conversation}  conversation        [Conversation]{@link Conversation} where the message have been sent.
 * @property    {string}        ID                  Curse UUID of the message, this ID is shared between all references of this message.
 * @property    {string}        content             Text content of the message.
 * @property    {number}        notificationType    Specify the type of the notification following the conversations-v1 ConversationNotificationType endpoint definition.
 * * Normal: 0  (message received)
 * * Edited: 1  (message edited)
 * * Liked: 2   (message liked)
 * * Deleted: 3 (message deleted)
 * @property    {string}        senderName          Nickname (if set) or Curse username of the message author.
 * @property    {number}        senderID            Curse ID of the author of the message (same as MessageNotification.sender.ID).
 * @property    {User}          sender              [User]{@link User} object corresponding to the author of the message.
 * @property    {number}        serverTimestamp     Timestamp of the message on the server side.
 * @property    {number}        likes               Amount of likes.
 * @property    {array}         likeUserIDs         Array of number corresponding to the IDs of all the user liking this message.
 * @property    {boolean}       isDeleted           True if the message have been deleted (content will be empty then).
 * @property    {Role}          senderVanityRole    Most important [Role]{@link Role} of the author on this server (**undefined** if not a conversation from a server).
 * @property    {array}         senderRoles         Array of [Role]{@link Role} of the author on this server (**undefined** if not a conversation from a server).
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
        this.senderVanityRole;
        this.senderRoles = [];

        //Link to our users
        if(client.users.has(conversationMessageNotification.SenderID)){
            this.sender = client.users.get(conversationMessageNotification.SenderID);
        } else {
            this.sender = new usersModule.User(conversationMessageNotification.SenderID, client);
        }

        //Add roles field to message
        if(this.conversation.channel != undefined){
            //Update VanityRole
            var server = this.conversation.channel.server;
            this.senderVanityRole = server.roles.get(conversationMessageNotification.SenderVanityRole);
            //Update Roles
            for (let roleID of conversationMessageNotification.SenderRoles){
                this.senderRoles.push(server.roles.get(roleID));
            }
        }
    }

    /**
     * @description Edit the content of the message
     * @param  {string}   newContent Text of the new message
     * @param  {Function} callback  Facultative arg, callback: (errors) => {}.
       This function can take an argument errors that is null or undefined when function ends correctly.
     */
    editContent(newContent, callback){
        //Define an empty void if no callback specified
        if(callback === undefined){
            callback = _ => {};
        }
        var self = this;
        //TODO: Check twice like with deleteMessage
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
     * @description Delete the message from the conversation
     * @param  {Function} callback  Facultative arg, callback: (errors) => {}.
       This function can take an argument errors that is null or undefined when function ends correctly.
     */
    deleteMessage(callback){
        //Define an empty void if no callback specified
        if(callback === undefined){
            callback = _ => {};
        }
        var self = this;
        conversationsEndpoint.conversationsDelete(this.conversation.ID, this.ID,
            this.serverTimestamp, this.conversation.client.token, function(errors){
                //Check twice, sometimes the notifications endpoint is too fast for the conversations endpoint
                //and conversation isn't aware of the message yet. So we wait 1sec and try again..

                //We check for an existing error with the code 404 encountered for the first time
                if(errors != undefined && errors.code === 404 && self._secondDelete == undefined){
                    winston.log('debug', 'Message.deleteContent', 'First attempt denied, retrying');
                    self._secondDelete = setTimeout(function(){
                        self.deleteMessage(callback);
                    }, 1000);
                }
                //Handle second time error, or other kind of errors than previously check
                else if(errors != undefined){
                    //Clean the request checker
                    if(self._secondDelete != undefined){
                        delete(self._secondDelete);
                    }
                    winston.log('error', 'Message.deleteContent', 'Cannot delete message', self.ID, self.serverTimestamp);
                    callback(errors);
                }
                //It worked
                else {
                    //Clean the request checker
                    if(self._secondDelete != undefined){
                        delete(self._secondDelete);
                    }
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
