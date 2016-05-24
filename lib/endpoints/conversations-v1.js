'use strict';

var req = require('../utils/requests.js');

var host = 'conversations-v1.curseapp.net';

class ConversationEditMessageRequest {
    constructor(body, mentions=[]){
        this.Body = body;
        this.Mentions = mentions;
    }
}

function conversationsEdit(conversationID, messageID, messageTimestamp, conversationEditMessageRequest, token, callback){
    var post_data = conversationEditMessageRequest;
    var endpoint = '/conversations' + '/' + conversationID + '/' + messageID + '-' + messageTimestamp;
    req.post(host, endpoint, post_data, token, callback);
}

exports.ConversationEditMessageRequest = ConversationEditMessageRequest;
exports.conversationsEdit = conversationsEdit;
