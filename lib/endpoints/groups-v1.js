'use strict';

var req = require('../utils/requests.js');
var winston = require('winston');

var host = 'groups-v1.curseapp.net';

var GroupType = {
    Normal: 0,
    Large: 1,
    Temporary: 2
}

var GroupMode = {
    TextAndVoice: 0,
    TextOnly: 1
}

function deleteGroupMember(groupID, userID, token, callback){
    var parameters = {
        host: host,
        endpoint: '/groups/' + groupID + '/members/' + userID,
        token: token
    }
    req.del(parameters, function(errors, answer){
        if(errors === null){
            callback(null);
        }
        else {
            winston.log('error', 'groups-v1.deleteGroupMember', 'Cannot complete request');
            callback(errors);
        }
    });
}

function serverBanUser(groupID, userID, reason, token, callback){
    var parameters = {
        host: host,
        endpoint: '/servers/' + groupID + '/bans',
        token: token
    }
    var data = {
        UserID: userID,
        Reason: reason,
        BanIP: false
    }
    req.post(parameters, data, function(errors, answer){
        if(errors === null){
            callback(null);
        }
        else {
            winston.log('error', 'groups-v1.serverBanUser', 'Cannot complete request');
            callback(errors);
        }
    });
}

exports.GroupType = GroupType;
exports.GroupMode = GroupMode;
exports.deleteGroupMember = deleteGroupMember;
exports.serverBanUser = serverBanUser;
