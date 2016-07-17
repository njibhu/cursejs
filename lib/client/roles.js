'use strict';

var groupsEndpoints = require('../endpoints/groups-v1.js');
var usersModule = require('./users.js');
var winston = require('winston');

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
     * Callback with a boolean to know if a user is member of this group or not, answer is transmitted through callback
     * @param  {User}     user     User to check
     * @param  {Function} callback Callback function(errors, boolean), boolean is the answer
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
     * Get all the members of the server role.
     * @param  {Function} callback(errors, User, done) Return false to interrupt chain of callbacks
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


}

exports.Role = Role;
