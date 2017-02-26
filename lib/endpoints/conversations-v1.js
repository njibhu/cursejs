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

var ConversationType = {
    Friendship: 0,
    Group: 1,
    AdHoc: 2,
    GroupPrivateConversation: 3
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

class ConversationCreateMessageRequest {
    constructor(machineKey, attachmentID, clientID, body, attachmentRegionID){
        this.MachineKey = machineKey;
        this.AttachmentID = attachmentID;
        this.ClientID = clientID;
        this.Body = body;
        this.AttachmentRegionID = attachmentRegionID;
    }
}

/**
 * Post a message in a conversation
 * @param  {string}                             conversationID                          Conversation Server ID
 * @param  {ConversationCreateMessageRequest}   conversationCreateMessageRequest        Request object
 * @param  {string}                             token                                   Client token
 * @param  {(errors) => {}}                     callback                                Callback function, no errors = undefined
 */
function conversationsSend(conversationID, conversationCreateMessageRequest, token, callback){
    var parameters = {
        host: host,
        endpoint: '/conversations' + '/' + conversationID,
        token: token
    }
    req.post(parameters, conversationCreateMessageRequest, function(errors, answer){
        if(errors === null) {
            callback(null);
        }
        else {
            winston.log('debug', 'conversations-v1.conversationsSend', answer);
            callback(errors);
        }
    });
}

/**
 * Edit a message in conversation
 * @param  {string}                             conversationID                 Conversation Server ID
 * @param  {string}                             messageID                      Message Server ID
 * @param  {number}                             messageTimestamp               Message timestamp
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
            winston.log('debug', 'conversations-v1.conversationsEdit', answer);
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
            winston.log('debug', 'conversations-v1.conversationsDelete', 'Cannot complete request');
            callback(errors);
        }
    });
}

function history(id, endTimestamp, pageSize, token, callback){
    var parameters = {
        host: host,
        endpoint: '/conversations/' + id + '?endTimestamp=' + endTimestamp + '&pageSize=' + pageSize,
        token: token
    }
    req.get(parameters, function(errors, answer){
        if(errors === null){
            callback(null, answer);
        }
        else {
            winston.log('debug', 'conversations-v1.conversationsDelete', 'Cannot complete request');
            callback(errors, undefined);
        }
    })
}

exports.ConversationType = ConversationType;
exports.ConversationEditMessageRequest = ConversationEditMessageRequest;
exports.ConversationNotificationType = ConversationNotificationType;
exports.ConversationCreateMessageRequest = ConversationCreateMessageRequest;
exports.conversationsDelete = conversationsDelete;
exports.conversationsEdit = conversationsEdit;
exports.conversationsSend = conversationsSend;
exports.history = history;
