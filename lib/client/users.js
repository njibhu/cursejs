'use strict';

const assert = require('assert');

/**
 * User is the parent class of all Curse users we'll find here
 */
class User {
    constructor(userid, client){
        //We need the user to not exist already
        assert(client.users[userid] === undefined);
        client.users[userid] = this;
        //We belong to the client
        this.client = client;

        this.ID = userid;

        this.serverMember = []; //Server[]
        this.messageList = [];

        //Saves directly the object from curse API for internal use
        this._GroupMemberContract = {}; //Server: GroupMemberContract
        this._FriendshipContract = null;
    }

    _newMessage(message){
        //Check if message haven't been linked yet
        if(this.messageList.indexOf(message) === undefined){
            this.messageList.push(message);
        }
        //Check if the message is in a server channel, and if the user is registered to the server
        if(this.client.channels[message.conversation.ID] != undefined){
            var server = this.client.channels[message.conversation.ID].server;
            if(!server.isRegisteredMember(this)){
                //Then we register to it
                this._registerToServer(server);
            }
        }
    }

    _registerToServer(server){
        this.serverMember.push(server);
        server.userList.push(this);
    }

    _unregisterToServer(server){
        this.serverMember.pop(server);
        server.userList.pop(this);
    }

    get username(){
        //TODO endpoint from API: contacts-v1/users
    }
}

exports.User = User;
