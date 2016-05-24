'use strict';

var groupsModule = require('../endpoints/groups-v1.js');

/**
 * A Channel is a "group" of a Server (Private and group conversations are not channels).
 */
class Channel {
    constructor(channelContract, server, client){
        this._channelContract = channelContract;
        this.client = client;

        this.ID = this._channelContract.GroupID;
        this.name = this._channelContract.GroupTitle;
        this.description = this._channelContract.MessageOfTheDay;

        this.server = server;


        //Defining voice channel or text channel
        if(this._channelContract.GroupMode == groupsModule.GroupMode.TextAndVoice){
            this.isVoiceChannel = true;
        } else {
            this.isVoiceChannel = false;
        }

    }

    update(callback){

    }
}

function generateChannelListFromChannelArray(channelContractArray, server, client){
    var channellist = {};

    channelContractArray.forEach(function(elt){
        var channel = new Channel(elt, server, client);
        channellist[elt.GroupID] = channel;
    });

    return channellist;
}

exports.Channel = Channel;
exports.generateChannelListFromChannelArray = generateChannelListFromChannelArray;
