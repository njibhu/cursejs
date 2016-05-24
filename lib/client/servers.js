'use strict';

var channelModule = require('./channels.js');
var groupsEndpoints = require('../endpoints/groups-v1.js');
var Events = require('./events.js').Events;

/**
 * A Server is a large Curse group root, to not mix up with groups.
 */
class Server {
    constructor(groupNotification, client){
        this.client = client;
        this._groupNotification = groupNotification;
        this.channelList = {};

        this.channelList = channelModule.generateChannelListFromChannelArray(groupNotification.Channels, this, client);
        //TODO: this.roleList = new roleModule.roleList(groupNotification.roles);

        this.name = this._groupNotification.GroupTitle;
        this.ID = this._groupNotification.GroupID;

    }

    /**
     * Get all the members of the server. Member list is not really consistent, use with care.
     * @param  {Function} callback(User[]) Array of User (see users module)
     */
    getMembers(callback){

    }

    /**
     * Update the server channel list, call the callback when done
     * @param  {Function} callback Callback when list of channel is updated
     */
    updateChannelList(callback){

    }
}

function generateServerListFromGroupArray(groupArray, client){
    var serverlist = {};

    groupArray.forEach(function(elt){
        //Sort out server vs groups, and get only servers
        if(elt.GroupType == groupsEndpoints.GroupType.Large){
            var server = new Server(elt, client);
            serverlist[elt.GroupID] = server;
        }
    });

    return serverlist;
}

exports.Server = Server;
exports.generateServerListFromGroupArray = generateServerListFromGroupArray;
