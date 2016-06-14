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
    constructor(body, mentions){
        if(mentions === undefined){
            mentions = [];
        }
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
        if(errors === null){
            callback(null);
        }
        else {
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
        if(errors === null){
            callback(null);
        }
        else {
            winston.log('error', 'conversations-v1.conversationsDelete', 'Cannot complete request');
            callback(errors);
        }
    });
}

function history(id, endTimestamp, pageSize, token, callback){
    var parameters = {
        host: host,
        endpoint: 'conversations/' + id + '?endTimestamp=' + endTimestamp + '&pageSize=' + pageSize,
        token: token
    }
    req.get(parameters, function(errors, answer){
        if(errors === null){
            callback(null, answer);
        }
        else {
            winston.log('error', 'conversations-v1.conversationsDelete', 'Cannot complete request');
            callback(errors, undefined);
        }
    })
}

exports.ConversationEditMessageRequest = ConversationEditMessageRequest;
exports.ConversationNotificationType = ConversationNotificationType;
exports.conversationsDelete = conversationsDelete;
exports.conversationsEdit = conversationsEdit;
exports.history = history;
