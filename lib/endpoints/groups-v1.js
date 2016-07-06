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

function getGroup(groupID, showDeletedChannels, token, callback){
    var parameters = {
        host: host,
        endpoint: '/groups/' + groupID + '?showDeletedChannels=' + showDeletedChannels,
        token: token
    }
    req.get(parameters, function(errors, answer){
        if(errors === null){
            callback(null, answer);
        }
        else {
            winston.log('error', 'groups-v1.getGroup', 'Cannot complete request');
            callback(errors, undefined);
        }
    })
}

function getBanList(groupID, query, pageSize, pageNumber, token, callback){
    var args = false;
    var endpoint = '/servers/' + groupID + '/bans';
    if(query != null){
        if(!args){
            endpoint += "?query=" + query;
            args = true;
        } else {
            endpoint += "&query=" + query;
        }
    }
    if(pageSize != null){
        if(!args){
            endpoint += "?pageSize=" + pageSize;
            args = true;
        } else {
            endpoint += "&pageSize=" + pageSize;
        }
    }
    if(pageNumber != null){
        if(!args){
            endpoint += "?pageNumber=" + pageNumber;
            args = true;
        } else {
            endpoint += "&pageNumber=" + pageNumber;
        }
    }
    var parameters = {
        host: host,
        endpoint: endpoint,
        token: token
    }
    req.get(parameters, function(errors, answer){
        if(errors === null){
            callback(null, answer);
        }
        else {
            winston.log('error', 'groups-v1.getBanList', 'Cannot complete request');
            callback(errors, undefined);
        }
    })
}

function serverUnbanUser(groupID, userID, token, callback){
    var parameters = {
        host: host,
        endpoint: '/servers/' + groupID + '/bans/' + userID,
        token: token
    }
    req.del(parameters, function(errors, answer){
        if(errors === null){
            callback(null, answer);
        }
        else {
            winston.log('error', 'groups-v1.getGroup', 'Cannot complete request');
            callback(errors, undefined);
        }
    })
}


exports.getGroup = getGroup;
exports.GroupType = GroupType;
exports.GroupMode = GroupMode;
exports.deleteGroupMember = deleteGroupMember;
exports.serverBanUser = serverBanUser;
exports.getBanList = getBanList;
exports.serverUnbanUser = serverUnbanUser;
