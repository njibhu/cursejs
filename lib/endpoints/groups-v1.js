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

var GroupMemberSearchSortType = {
    Default: 0,
    Role: 1,
    Username: 2,
    DateJoined: 3,
    DateLastActive: 4
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
            winston.log('debug', 'groups-v1.deleteGroupMember', 'Cannot complete request');
            callback(errors);
        }
    });
}

function serverBanUser(groupID, userID, reason, isBanIp, token, callback){
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
            winston.log('debug', 'groups-v1.serverBanUser', 'Cannot complete request');
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
            winston.log('debug', 'groups-v1.getGroup', 'Cannot complete request');
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
            winston.log('debug', 'groups-v1.getBanList', 'Cannot complete request');
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
            winston.log('debug', 'groups-v1.getGroup', 'Cannot complete request');
            callback(errors, undefined);
        }
    })
}

function leaveServer(groupID, token, callback){
    var parameters = {
        host: host,
        endpoint: '/groups/' + groupID + '/leave',
        token: token
    }
    req.post(parameters, null, function(errors, answer){
        if(errors === null){
            callback(null, answer);
        }
        else {
            winston.log('debug', 'groups-v1.leaveServer', 'Cannot complete request');
            callback(errors, undefined);
        }
    })
}

function joinInvitation(inviteCode, token, callback){
    var parameters = {
        host: host,
        endpoint: '/invitations/' + inviteCode,
        token: token
    }
    req.post(parameters, null, function(errors, answer){
        if(errors === null){
            callback(null, answer);
        }
        else {
            winston.log('debug', 'groups-v1.joinInvitation', 'Cannot complete request');
            callback(errors, undefined);
        }
    })
}

function getInvitationDetails(inviteCode, token, callback){
    var parameters = {
        host: host,
        endpoint: '/invitations/' + inviteCode,
        token: token
    }
    req.get(parameters, function(errors, answer){
        if(errors === null){
            callback(null, answer);
        }
        else {
            winston.log('debug', 'groups-v1.getInvitationDetails', 'Cannot complete request');
            callback(errors, undefined);
        }
    });
}

function getGroupMemberInfo(memberID, serverID, token, callback){
    var parameters = {
        host: host,
        endpoint: '/groups/' + serverID + '/members/' + memberID,
        token: token
    }
    req.get(parameters, function(errors, answer){
        if(errors === null){
            callback(null, answer);
        }
        else {
            winston.log('debug', 'groups-v1.getGroupMemberInfo', 'Cannot complete request');
            callback(errors, undefined);
        }
    })
}

function getGroupMembers(serverID, actives, page, pageSize, token, callback){
    var args = false;
    var endpoint = '/groups/' + serverID + '/members';
    if(actives != null){
        if(!args){
            endpoint += "?actives=" + actives;
            args = true;
        } else {
            endpoint += "&actives=" + actives;
        }
    }
    if(page != null){
        if(!args){
            endpoint += "?page=" + page;
            args = true;
        } else {
            endpoint += "&page=" + page;
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
            winston.log('debug', 'groups-v1.getGroupMembers', 'Cannot complete request');
            callback(errors, undefined);
        }
    })
}

function searchGroupMember(serverID, Username, RoleID, PageSize, Page, SortType, SortAscending, token, callback){
    var GroupMemberSearchRequest = {};
    if(Username != undefined){
        GroupMemberSearchRequest.Username = Username;
    }
    if(RoleID != undefined){
        GroupMemberSearchRequest.RoleID = RoleID;
    }
    if(PageSize != undefined){
        GroupMemberSearchRequest.PageSize = PageSize;
    }
    if(Page != undefined){
        GroupMemberSearchRequest.Page = Page;
    }
    if(SortType != undefined){
        GroupMemberSearchRequest.SortType = SortType;
    }
    if(SortAscending != undefined){
        GroupMemberSearchRequest.SortAscending = SortAscending;
    }

    var parameters = {
        host: host,
        endpoint: '/groups/' + serverID + '/members/search',
        token: token
    }
    req.post(parameters, GroupMemberSearchRequest, function(errors, answer){
        if(errors === null){
            callback(null, answer);
        }
        else {
            winston.log('debug', 'groups-v1.searchGroupMember', 'Cannot complete request');
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
exports.leaveServer = leaveServer;
exports.joinInvitation = joinInvitation;
exports.getGroupMemberInfo = getGroupMemberInfo;
exports.getInvitationDetails = getInvitationDetails;
exports.getGroupMembers = getGroupMembers;
exports.searchGroupMember = searchGroupMember;
exports.GroupMemberSearchSortType = GroupMemberSearchSortType;
