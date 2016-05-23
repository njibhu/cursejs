'use strict';

var conversationsModule = require('./conversations.js');


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
    }

    /**
     * This function is used internally to update a message from notification websocket
     * @param  {object} conversationMessageNotification ConversationMessageNotification object
     * @return {undefined} Does not return anything
     */
    update(conversationMessageNotification){
        this._historyNotifications.push(this._ConversationMessageNotification);
        this._ConversationMessageNotification = conversationMessageNotification;
    }

    get content(){
        return this._ConversationMessageNotification.Body;
    }

    editContent(newContent){

    }

    delete(){

    }

}

exports.Message = Message;
