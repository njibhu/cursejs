'use strict';

var channelModule = require('./channels.js');
var groupsEndpoints = require('../endpoints/groups-v1.js');
var Events = require('./events.js').Events;

/**
 * A Server is a large Curse group root, to not mix up with groups.
 */
class Server {
    constructor(groupNotification, client){
        this._client = client;
        this._groupNotification = groupNotification;
        this.channelList = {};

        //I don't like this tricky hack, need to find a better solution later
        var self = this; // for callback
        setTimeout(function(){ //Need to be executed AFTER the creation because a Channel needs a server to exist
            self.channelList = channelModule.generateChannelListFromChannelArray(groupNotification.Channels, client);
            self._client.emit(Events.SERVERLOADED, self);
        }, 0);

        //TODO: this.roleList = new roleModule.roleList(groupNotification.roles);

        this.name = this._groupNotification.GroupTitle;
        this.ID = this._groupNotification.GroupID;

    }

    /**
     * Get all the members of the server. Member list is not really consistent, use with care.
     * @param  {Function} callback(User[]) Array of User (see users module)
     * @return {undefined} Does not return anything.
     */
    getMembers(callback){

    }

    /**
     * Update the server channel list, call the callback when done
     * @param  {Function} callback Callback when list of channel is updated
     * @return {undefined} Does not return anything.
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
