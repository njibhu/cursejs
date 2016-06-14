'use strict';

const assert = require('assert');

var channelModule = require('./channels.js');
var groupsEndpoints = require('../endpoints/groups-v1.js');
var Events = require('./events.js').Events;
var winston = require('winston');

/**
 * A Server is a large Curse group root, to not mix up with groups.
 * It is the responsability of the caller to check if the server doesn't exist already
 */
class Server {
    constructor(groupNotification, client){
        //We need the server to not exist already
        assert(client.servers.has(groupNotification.GroupID) == false);
        client.servers.set(groupNotification.GroupID, this);

        //To use only internally
        this._groupNotification = groupNotification;

        this.client = client;
        this.nicknames = {};

        // GENERATE Channel list:
        this.channelList = [];
        for (let item of groupNotification.Channels){
            //Checking that channel doesn't exit
            if(this.client.channels.has(item.GroupID) == false){
                var channel = new channelModule.Channel(item, this, client);
                this.channelList.push(channel);
            }
            // The only way that can happen is that if the server object get deleted and not the channel
            else {
                if(this.channelList.indexOf(this.client.channels.get(item.GroupID)) === -1){
                    this.channelList.push(this.client.channels.get(item.GroupID));
                }
            }
        }

        //TODO: this.roleList = new roleModule.roleList(groupNotification.roles);

        this.name = this._groupNotification.GroupTitle;
        this.ID = this._groupNotification.GroupID;

        this.userList = [];
    }

    /**
     * Will check if the user have already been register (client side) to this server
     * @param  {User}       user    User you want to test
     * @return {Boolean}            Registered or not
     */
    isRegisteredMember(user){
        if(this.userList.indexOf(user) != -1){
            return true;
        } else {
            return false;
        }
    }

    /**
     * Kick a User from the server
     * @param  {User}     user       Specified user to kick
     * @param  {Function} callback   Callback, errors is null if everything is good
     */
    kickUser(user, callback){
        //Define an empty void if no callback specified
        if(callback === undefined){
            callback = _ => {};
        }
        var self = this;
        groupsEndpoints.deleteGroupMember(this.ID, user.ID, this.client.token, function(errors){
            if(errors != undefined){
                winston.log('error', 'Server.kickUser', 'Cannot kick user', user.ID);
                callback(errors);
            }
            else {
                callback(null);
            }
        });
    }

    /**
     * Kick a User from the server
     * @param  {User}     user       Specified user to ban
     * @param  {string}   reason     Reason of the ban
     * @param  {Function} callback   Callback, errors is null if everything is good
     */
    banUser(user, reason, callback){
        //Define an empty void if no callback specified
        if(callback === undefined){
            callback = _ => {};
        }
        if(reason === undefined){
            reason = "";
        }
        var self = this;
        groupsEndpoints.serverBanUser(this.ID, user.ID, reason, this.client.token, function(errors){
            if(errors != undefined){
                winston.log('error', 'Server.kickUser', 'Cannot kick user', user.ID);
                callback(errors);
            }
            else {
                callback(null);
            }
        });
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

exports.Server = Server;
