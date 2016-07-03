'use strict';

const assert = require('assert');
var winston = require('winston');

var contactsEndpoints = require('../endpoints/contacts-v1.js');

/**
 * User is the parent class of all Curse users we'll find here
 */
class User {
    constructor(userid, name, client){
        //We need the user to not exist already
        assert(client.users.has(userid) == false);
        client.users.set(userid, this);

        this.client = client;
        this.ID = userid;

        this._username = undefined;

    }

    /**
     * Get the name of the curse account for this user (asynchronously, answer via callback)
     * @param  {Function} callback Takes 2 arguments, first is error (should be null), 2nd is the username
     */
    username(callback){
        var self = this;
        if(this._username == undefined){
            contactsEndpoints.user(this.ID, this.client.token, function(errors, data){
                if(errors == null){
                    self._username = data.content['Username'];
                    callback(null, self._username);
                }
                else {
                    winston.log('error', 'User.username', 'Cannot get username');
                    winston.log('debug', 'User.username', errors);
                    callback(errors, undefined);
                }
            });
        } else {
            callback(null, this._username);
        }
    }
}

exports.User = User;
