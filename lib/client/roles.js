'use strict';

var groupsEndpoints = require('../endpoints/groups-v1.js');
var usersModule = require('./users.js');
var winston = require('winston');

/**
 * @class Role
 * @description Server role users can have on a [Server]{@link Server}
 * @property    {number}    ID          Identifier of the role, the owner usually has the role 0.
 * @property    {Server}    server      [Server]{@link Server} owner of this [Role]{@link Role}.
 * @property    {Client}    client      [Client]{@link Client} object used to create this [Role]{@link Role} instance.
 * @property    {string}    name        Name of this role.
 * @property    {number}    rank        Rank of this role, the most powerful rank (the owner), is the lowest, and the less important the bigger the rank is.
 * @property    {boolean}   isDefault   If true, this is the role of all new users on the server.
 */
class Role {
    constructor(id, name, rank, isDefault, server, client){
        this.ID = id;
        this.server = server;
        this.client = client;
        this._update(name, rank, isDefault);
    }

    _update(name, rank, isDefault){
        this.name = name;
        this.rank = rank;
        this.isDefault = isDefault;
    }

    /**
     * @description Callback with a boolean to know if a user is member of this group or not, answer is transmitted through callback
     * @param  {User}       user        User to check
     * @param  {Function}   callback    callback: (errors, isRole) => {}.
     * * **errors** is **null** or **undefined** when everything happens correctly.
     * * **isRole** is a **boolean**, **true** if the [User]{@link User} has the role, **false** if not.
     */
    isMember(user, callback){
        var self = this;
        groupsEndpoints.getGroupMemberInfo(user.ID, this.server.ID, this.client.token, function(errors, answer){
            if(errors === null){
                var data = answer.content;
                var isRole = false;
                for (let role of data.Roles){
                    if(role == self.ID){
                        isRole = true;
                    }
                }
                callback(null, isRole);
            }
            else {
                winston.log('error', 'Roles.isMember', 'API Request failed, cannot return result.');
                callback(errors);
            }
        });
    }

    /**
     * Iterate through all the members of this server role.
     * @param  {Function}   callback    callback: (errors, user, done) => {}.
     * * **errors** is **null** or **undefined** when everything happens correctly.
     * * **user** is a [User]{@link User} member of this role.
     * * **done** is a **boolean**, **true** when there is no more users to iterate over.
     * * To stop the iteration return false inside the callback
     *
     * @example
     * myRole.everyMember(function(errors, user, done){
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
    everyMember(callback){
        var self = this;
        var page = 1;
        var userArray = [];
        var continueLoop = true;
        function requestCallback(){
            groupsEndpoints.searchGroupMember(self.server.ID, undefined, self.ID, 50, page,
                groupsEndpoints.GroupMemberSearchSortType.DateJoined, true, self.client.token, function(errors, answer){
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
                                var user = self.client.getUser(tempUser.UserID);
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


}

exports.Role = Role;
