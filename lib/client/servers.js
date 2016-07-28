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
 * @class Server
 * @description A Server is a large Curse group root, to not mix up with groups.
 * It is the responsability of the caller to check if the server doesn't exist already
 * @property    {Client}    client          [Client]{@link Client} object used to create this [Server]{@link Server} instance.
 * @property    {string}    ID              Curse UUID of the server.
 * @property    {string}    name            Name of the server.
 * @property    {Map}       roles           Regroup all the [Roles]{@link Role} of the current [Server]{@link Server}.
 * The keys are the roles IDs and the values are instances of the [Role]{@link Role} class.
 * @property    {array}     channelList     Regroup all the [Channels]{@link Channel} of the current [Server]{@link Server}.
 */
class Server {
    constructor(serverID, client){
        //We need the server to not exist already
        assert(client.servers.has(serverID) == false);
        client.servers.set(serverID, this);

        this._ready = false;
        this.client = client;

        this.ID = serverID;
        this.name;

        this.roles = new Map();
        this.channelList = [];

        var self = this;
        this._updateInformations(function(errors){
            if(errors === null){
                self._ready = true;
                self.client._ready();
            }
            else {
                winston.log('error', 'Server.constructor', 'Cannot initialize server instance, deleting instance.');
                self.client.servers.delete(groupNotification.GroupID);
            }
        });
    }

    /**
     * Kick a User from the server
     * @param  {User}     user          Specified user to kick
     * @param  {Function} callback      Facultative arg, callback: (errors) => {}.
       This function can take an argument errors that is null or undefined when function ends correctly.
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
     * @param  {User}     user          Specified user to ban
     * @param  {string}   reason        Reason of the ban
     * @param  {Function} callback      Facultative arg, callback: (errors) => {}.
       This function can take an argument errors that is null or undefined when function ends correctly.
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
     * @description Iterate through all the members of the server.
     * @param  {Function}       callback        callback: (errors, user, done) => {}.
     * * **errors** is **null** or **undefined** when everything happens correctly.
     * * **user** is a [User]{@link User} object of the next user.
     * * **done** is a **boolean**, **true** when there is no more user to iterate over.
     * * To stop the iteration return false inside the callback
     *
     * @example
     * myServer.everyServerMembers(function(errors, user, done){
     *     if(errors == null && !done){
     *
     *         //Work with the user object
     *
     *         //This will stop the iteration if the user with curse ID 1 is found
     *         if(user.ID === 1){
     *             return false;
     *         }
     *     }
     * });
     */
    everyServerMembers(callback){
        var self = this;
        var page = 1;
        var userArray = [];
        var continueLoop = true;
        function requestCallback(){
            groupsEndpoints.getGroupMembers(self.ID, false, page, 50, self.client.token, function(errors, answer){
                if(errors === null){
                    userArray = answer.content;

                    //What if endpoints return empty array ?
                    if(userArray.length == 0){
                        continueLoop = false;
                        callback(null, undefined, true);
                    } else {
                        page = page + 1;
                        //While locale
                        while(userArray.length > 0 && continueLoop){
                            var tempUser = userArray.shift();
                            var user = new usersModule.User(tempUser.UserID, self.client);
                            user._username = tempUser.Username;

                            //Stop loop when user return false
                            continueLoop = callback(null, user, false) != false;
                        }
                        if(userArray.length == 0 && continueLoop){
                            requestCallback();
                        }
                    }
                }
                else{
                    callback(errors, undefined, true);
                }
            });
        }
        requestCallback();
    }

    /*
     * Update the server channel list, call the callback when done
     * @param  {Function} callback Callback when list of channel is updated
     */
    _updateInformations(callback){
        //Update channels, update roles, member count..
        var self = this;

        groupsEndpoints.getGroup(this.ID, false, this.client.token, function(errors, data){
            if(errors === null){
                var groupNotif = data.content;

                //To use only internally
                self._groupNotification = groupNotif;

                //Set server name
                self.name = self._groupNotification.GroupTitle;

                // Generate or update channelList:
                for (let channelItem of groupNotif.Channels){
                    //Checking that channel doesn't exit
                    if(self.client.channels.has(channelItem.GroupID) == false){
                        var channel = new channelsModule.Channel(channelItem, self, self.client);
                        self.channelList.push(channel);
                    }

                    // If channel already exists, then we update it and check that it's in channelList
                    else {
                        var channel = self.client.channels.get(channelItem.GroupID);
                        channel._update(channelItem);
                        if(self.channelList.indexOf(channel) === -1){
                            self.channelList.push(channel);
                        }
                    }
                }

                // Generate or update server roles
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
                    //If the role already exist, we just update it
                    else {
                        self.roles.get(roleItem["RoleID"]._update(
                            roleItem["Name"],
                            roleItem["Rank"],
                            roleItem["IsDefault"]));
                    }
                }

                //Callback with no errors
                callback(null);

            } else {
                winston.log('error', 'Server._updateInformations', 'Cannot fetch server informations, no update made');
                winston.log('debug', 'Server._updateInformations', groupNotification.GroupID, groupNotification.GroupTitle);
                winston.log('debug', 'Server._updateInformations');
                callback(errors);
            }
        });

    }

    /**
     * Send a private message to a user inside a server
     * @param  {User}     user              User to send the message
     * @param  {string}   messageContent    Content of the message
     * @param  {Function} callback          Facultative arg, callback: (errors) => {}.
       This function can take an argument errors that is null or undefined when function ends correctly.
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
    /**
     * Search for bans in the server. Arguments can be set to **undefined**.
     * @param  {string}   query     String to search the ban (Curse API don't give much detail on it).
     * @param  {number}   pagesize  Maximum size for the page of results.
     * @param  {number}   page      First page is 1.
     * @param  {Function} callback  Callback: (errors, bans) => {}.
     * * **errors** is null or undefined when function ends correctly.
     * * **bans** is an **array** of ban objects following a specific definition:
     *    * **user** - Banned [User]{@link User}.
     *    * **userNickname** - Nickname of the banned user.
     *    * **banner** - [User]{@link User} author of the ban.
     *    * **bannerNickname** - Nickname of the author of the ban.
     *    * **serverTimestamp** - **number**, timestamp of the server at the time of the ban.
     *    * **reason** - **string** containing the reason of the ban from the author of the ban.
     *    * **isIpBan** - **boolean**, **true** if this is an IP ban.
     */
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
     * @description Unban a specified user from the current server
     * @param  {User}     user      User to unban
     * @param  {Function} callback  Facultative arg, callback: (errors) => {}.
       This function can take an argument errors that is null or undefined when function ends correctly.
     */
    unban(user, callback){
        //Define empty void if no callback
        if(callback === undefined){
            callback = _ => {};
        }
        groupsEndpoints.serverUnbanUser(this.ID, user.ID, this.client.token, function(errors, content){
            if(errors === undefined){
                callback();
            } else {
                callback(errors);
            }
        });
    }

    /**
     * @description Leave this server to not receive notifications from it anymore.
     * @param  {Function} callback  Facultative arg, callback: (errors) => {}.
       This function can take an argument errors that is null or undefined when function ends correctly.
     */
    leave(callback){
        //Define an empty void if no callback specified
        if(callback === undefined){
            callback = _ => {};
        }
        groupsEndpoints.leaveServer(this.ID, this.client.token, function(errors, content){
            if(callback === undefined){
                callback();
            } else {
                callback(errors);
            }
        });
    }

    /**
     * Search for a particular user, the callback returns an array of researchResult objects
     * All parameters are facultative, but use everyServerMembers to check the server memberlist
     * @param  {string}     Username      Username to search for
     * @param  {number}     RoleID        Role ID to look into
     * @param  {number}     ResultSize    Size of the answer, API limits mosts of the arrays to 50 or 100 items
     * @param  {number}     ResultPage    First page is 1
     * @param  {number}     SortType      Follows groups-v1.GroupMemberSearchSortType definition.
     * * Default: 0
     * * Role: 1
     * * Username: 2
     * * DateJoined: 3
     * * DateLastActive: 4
     * @param  {boolean}    SortAscending Ascending is **true**, descending is **false**.
     * @param  {Function}   callback  Callback: (errors, results) => {}.
     * * **errors** is null or undefined when function ends correctly.
     * * **results** is an **array** of researchResult objects following a specific definition:
     *    * **User** - Corresponding [User]{@link User} object.
     *    * **Username** - **string**, Curse username.
     *    * **Nickname** - **string**, Nickname of the user on this server, if set.
     *    * **BestRole** - [Role]{@link Role} corresponding to the best role of the user on this server.
     *    * **Roles** - Array of [Role]{@link Role} to which the user is member of on this server.
     *    * **DateJoined** - **number**, server timestamp when the user joined this server.
     *    * **ConnectionStatus** - **number**
     *    * **DateLastSeen** - **number**, server timestamp when the user was last seen (connected).
     *    * **DateLastActive** - **number**, server timestamp when the user was last active.
     *    * **IsActive** - **boolean**, true if the user is active.
     *    * **CurrentGameID** - **number**, ID of the current played game by the user.
     */
    searchUser(Username, RoleID, ResultSize, ResultPage, SortType, SortAscending, callback){
        var self = this;
        groupsEndpoints.searchGroupMember(this.ID, Username, RoleID, ResultSize, ResultPage, SortType, SortAscending,
            this.client.token, function(errors, answer){
                if(errors === null){
                    var data = answer.content;
                    var results = [];
                    for (let item of data){
                        //Create researchResult object
                        var researchResult = {
                            User: self.client.getUser(item.UserID),
                            Username: item.Username,
                            Nickname: item.Nickname,
                            BestRole: self.roles.get(item.BestRole),
                            Roles: [],
                            DateJoined: item.DateJoined,
                            ConnectionStatus: item.ConnectionStatus,
                            DateLastSeen: item.DateLastSeen,
                            DateLastActive: item.DateLastActive,
                            IsActive: item.IsActive,
                            CurrentGameID: item.CurrentGameID
                        }
                        //Add roles to researchResult
                        for (let role of item.Roles){
                            researchResult.Roles.push(self.roles.get(role));
                        }
                        //Add researchResult to result array
                        results.push(researchResult);
                    }
                    callback(null, results);
                }
                else{
                    callback(errors, null);
                }
            }
        );
    }

}

exports.Server = Server;