'use strict';

const assert = require('assert');

var conversationsModule = require('./conversations.js');
var conversationsEndpoint = require('../endpoints/conversations-v1.js');
var Events = require('../client/events.js').Events;
var winston = require('winston');

/**
 * A Message is a text message
 */
class Message {
    constructor(conversationMessageNotification, conversation, client){
        //We need the conversation to not exist already
        assert(client.messages[conversationMessageNotification.ServerID] === undefined);
        client.messages[conversationMessageNotification.ServerID] = this;

        //TODO: better history handling
        this._ConversationMessageNotification = conversationMessageNotification;
        this._historyNotifications = [];
        this.conversation = conversation;
        this.ID = conversationMessageNotification.ServerID;
        this.senderName = conversationMessageNotification.SenderName;
        this.senderID = conversationMessageNotification.SenderID;
        this.timestamp = conversationMessageNotification.Timestamp;
    }

    /**
     * This function is used internally to update a message from notification websocket
     * @param  {object} conversationMessageNotification ConversationMessageNotification object
     */
    update(conversationMessageNotification){
        this._historyNotifications.push(this._ConversationMessageNotification);
        this._ConversationMessageNotification = conversationMessageNotification;
    }

    get content(){
        return this._ConversationMessageNotification.Body;
    }

    editContent(newContent){
        var self = this;
        var req = new conversationsEndpoint.ConversationEditMessageRequest(newContent, []);
        conversationsEndpoint.conversationsEdit(this.conversation.ID, this.ID,
            this.timestamp, req, this.conversation.client.token, function(errors){
                if(errors != undefined){
                    winston.log('error', 'Message.editContent', 'Cannot edit message', self._ConversationMessageNotification);
                }
            });
    }

    delete(){

    }

}

exports.Message = Message;
