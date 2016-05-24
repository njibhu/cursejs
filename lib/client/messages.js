'use strict';

var conversationsModule = require('./conversations.js');
var conversationsEndpoint = require('../endpoints/conversations-v1.js');
var Events = require('../client/events.js').Events;

/**
 * A Message is a text message
 */
class Message {
    constructor(conversationMessageNotification, conversation){
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

    //TODO Check if message have been edited using Conversation class
    editContent(newContent){
        var req = new conversationsEndpoint.ConversationEditMessageRequest(newContent, []);
        conversationsEndpoint.conversationsEdit(this.conversation.ID, this.ID,
            this.timestamp, req, this.conversation.client.token, function(answer){
                //Make work with events?
            });
    }

    delete(){

    }

}

exports.Message = Message;
