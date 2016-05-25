'use strict';

const assert = require('assert');

var groupsModule = require('../endpoints/groups-v1.js');

/**
 * A Channel is a "group" of a Server (Private and group conversations are not channels).
 */
class Channel {
    constructor(channelContract, server, client){
        //We need the channel to not already be existing
        assert(client.channels[channelContract.GroupID] === undefined);
        client.channels[channelContract.GroupID] = this;

        this._channelContract = channelContract;
        this.client = client;

        this.ID = this._channelContract.GroupID;
        this.name = this._channelContract.GroupTitle;
        this.description = this._channelContract.MessageOfTheDay;

        this.server = server;

        //Defining voice channel or text channel
        this.isVoiceChannel = (this._channelContract.GroupMode == groupsModule.GroupMode.TextAndVoice);

    }

    update(callback){

    }
}

exports.Channel = Channel;
