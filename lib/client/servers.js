'use strict';

const assert = require('assert');
var winston = require('winston');

var channelsModule = require('./channels.js');
var rolesModule = require('./roles.js');
var groupsEndpoints = require('../endpoints/groups-v1.js');
var Events = require('./events.js').Events;
var conversationsEndpoint = require('../endpoints/conversations-v1.js');
var conversationsModule = require('./conversations.js');
var usersModule = require('./users.js');

/**
 * A Server is a large Curse group root, to not mix up with groups.
 * It is the responsability of the caller to check if the server doesn't exist already
 */
class Server {
    constructor(groupNotification, client){
        //We need the server to not exist already
        assert(client.servers.has(groupNotification.GroupID) == false);
        client.servers.set(groupNotification.GroupID, this);

        this._ready = false;
        var self = this;

        //Call the group endpoint to get all informations about the server
        //The GroupNotification we get from the contact endpoint is truncated
        groupsEndpoints.getGroup(groupNotification.GroupID, false, client.token, function(errors, data){
            var groupNotif = data.content;
            if(errors === null){
                //To use only internally
                self._groupNotification = groupNotif;

                self.client = client;

                // GENERATE Channel list:
                self.channelList = [];
                for (let channelItem of groupNotif.Channels){
                    //Checking that channel doesn't exit
                    if(self.client.channels.has(channelItem.GroupID) == false){
                        var channel = new channelsModule.Channel(channelItem, self, client);
                        self.channelList.push(channel);
                    }
                    // The only way that can happen is that if the server object get deleted and not the channel
                    else {
                        if(self.channelList.indexOf(self.client.channels.get(channelItem.GroupID)) === -1){
                            self.channelList.push(self.client.channels.get(channelItem.GroupID));
                        }
                    }
                }

                // GENERATE Role map
                self.roles = new Map();
                for (let roleItem of groupNotif.Roles){
                    //Checking that the role is not a duplicate
                    if(self.roles.has(roleItem["RoleID"]) === false){
                        var role = new rolesModule.Role(
                            roleItem["RoleID"],
                            roleItem["Name"],
                            roleItem["Rank"],
                            roleItem["IsDefault"],
                            self,
                            self.client
                        );
                        self.roles.set(roleItem["RoleID"], role);
                    }
                }

                self.name = self._groupNotification.GroupTitle;
                self.ID = self._groupNotification.GroupID;

                self.userList = [];
                self._ready = true;
            } else {
                winston.log('error', 'Server.constructor', 'Cannot fetch server informations, cancelling');
                winston.log('debug', 'Server.constructor', groupNotification.GroupID, groupNotification.GroupTitle);
                client.servers.delete(groupNotification.GroupID);
            }
            client._ready();
        });

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
    everyServerMembers(callback){
        //TODO Create Server.everyServerMembers function
        //https://groups-v1.curseapp.net/Help/Api/POST-groups-groupID-members
    }

    /**
     * Update the server channel list, call the callback when done
     * @param  {Function} callback Callback when list of channel is updated
     */
    _updateChannelList(callback){
        //TODO Create Server._updateChannelList function
    }

    /**
     * Send a private message to a user inside a server
     * @param  {User}     user           User to send the message
     * @param  {string}   messageContent Content of the message
     * @param  {Function} callback       Function callback
     */
    sendPrivateConversationMessage(user, messageContent, callback){
        // Create conversation string "serverID:smallID:biggerID"
        if(this.client.clientID > user.ID){
            var conversationID = this.ID + ':' + user.ID + ':' + this.client.clientID;
        } else {
            var conversationID = this.ID + ':' + this.client.clientID + ':' + user.ID;
        }

        // Check if conversation exist, if not create a conversation
        if(this.client.conversations.has(conversationID)){
            var conversation = this.client.conversations.get(conversationID);
        } else {
            var conversation = new conversationsModule.Conversation(conversationID,
                conversationsEndpoint.ConversationType.GroupPrivateConversation, this.client);
        }
        // Use sendmessage from conversation
        conversation.sendMessage(messageContent, callback);
    }

    //Arguments must be filled with at least null, callback must be here
    getBans(query, pagesize, page, callback){
        var self = this;
        groupsEndpoints.getBanList(this.ID, query, pagesize, page, this.client.token, function(errors, answer){
            if(errors == null){
                var bans = [];
                for(let banItem of answer.content){
                    //Link user with our users
                    if(self.client.users.has(banItem.UserID)){
                        var user = self.client.users.get(banItem.UserID);
                    } else {
                        var user = new usersModule.User(banItem.UserID, self.client);
                    }
                    //Link banner with our users
                    if(self.client.users.has(banItem.RequestorUserID)){
                        var userbanner = self.client.users.get(banItem.RequestorUserID);
                    } else {
                        var userbanner = new usersModule.User(banItem.RequestorUserID, self.client);
                    }
                    bans.push({
                        user: user,
                        userNickname: banItem.Username,
                        banner: userbanner,
                        bannerNickname: banItem.RequestorUsername,
                        serverTimestamp: banItem.StatusTimestamp,
                        reason: banItem.Reason,
                        isIpBan: (banItem.MaskedIPAddress != null)
                    });
                }
                callback(null, bans);
            } else {
                callback(errors, undefined);
            }
        });
    }

    /**
     * Unban a specified user from the current server
     * @param  {User}     user     User to unban
     * @param  {Function} callback Function callback(errors)
     */
    unban(user, callback){
        groupsEndpoints.serverUnbanUser(this.ID, user.ID, this.client.token, function(errors, content){
            if(callback === undefined){
                callback();
            } else {
                callback(errors);
            }
        });
    }

    /**
     * Leave this server to not receive notifications from it anymore.
     * @param  {Function} callback Function callback(errors)
     */
    leave(callback){
        groupsEndpoints.leaveServer(this.ID, this.client.token, function(errors, content){
            if(callback === undefined){
                callback();
            } else {
                callback(errors);
            }
        });
    }
}

exports.Server = Server;
