'use strict';

var req = require('../utils/requests.js');
var winston = require('winston');

var host = 'conversations-v1.curseapp.net';

var ConversationNotificationType = {
    Normal: 0,
    Edited: 1,
    Liked: 2,
    Deleted: 3
}

class ConversationEditMessageRequest {
    constructor(body, mentions=[]){
        this.Body = body;
        this.Mentions = mentions;
    }
}

/**
 * Edit a message in conversation
 * @param  {string}                             conversationID                 Conversation Server ID
 * @param  {string}                             messageID                      Message Server ID
 * @param  {int}                                messageTimestamp               Message timestamp
 * @param  {ConversationEditMessageRequest}     conversationEditMessageRequest Request object
 * @param  {string}                             token                          Client token
 * @param  {(errors) => {}}                     callback                       Callback function, no errors = undefined
 */
function conversationsEdit(conversationID, messageID, messageTimestamp, conversationEditMessageRequest, token, callback){
    var parameters = {
        host: host,
        endpoint: '/conversations' + '/' + conversationID + '/' + messageID + '-' + messageTimestamp,
        token: token
    }
    req.post(parameters, conversationEditMessageRequest, function(errors, answer){
        if(errors === null && answer.code === 200){
            callback(null);
        }
        //If code is 404 that means that we dont have the right to edit it
        else if (errors === null){
            callback(answer);
        } else {
            winston.log('error', 'conversations-v1.conversationsEdit', answer);
            callback(errors);
        }
    });
}

function conversationsDelete(conversationID, messageID, messageTimestamp, token, callback){
    var parameters = {
        host: host,
        endpoint: '/conversations' + '/' + conversationID + '/' + messageID + '-' + messageTimestamp,
        token: token
    }
    req.del(parameters, function(errors, answer){
        if(errors === null && answer.code === 200){
            callback(null);
        }
        //If code is 404 that means that we dont have the right to edit it
        else if (errors === null){
            callback(answer);
        } else {
            winston.log('error', 'conversations-v1.conversationsEdit', answer);
            callback(errors);
        }
    });
}

exports.ConversationEditMessageRequest = ConversationEditMessageRequest;
exports.ConversationNotificationType = ConversationNotificationType;
exports.conversationsDelete = conversationsDelete;
exports.conversationsEdit = conversationsEdit;
