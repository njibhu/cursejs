'use strict';

const assert = require('assert');

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

    }

    get username(){
        //TODO endpoint from API: contacts-v1/users
    }
}

exports.User = User;
