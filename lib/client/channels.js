'use strict';

const assert = require('assert');
var winston = require('winston');

var groupsModule = require('../endpoints/groups-v1.js');
var conversationsEndpoint = require('../endpoints/conversations-v1.js');
var conversationsModule = require('./conversations.js');


/**
 * A Channel is a "group" of a Server (Private and group conversations are not channels).
 */
class Channel {
    constructor(channelContract, server, client){
        //We need the channel to not already be existing
        assert(client.channels.has(channelContract.GroupID) == false);
        client.channels.set(channelContract.GroupID, this);

        this.client = client;
        this.ID = channelContract.GroupID;

        this.server = server;

        this._update(channelContract);
    }

    /**
     * Update the channel from a channelContract object
     * @param  {object}   channelContract channelContract are object fetched from Curse API describing a channel
     * @param  {Function} callback        function that will be called after updating, the argument is error encountered
     */
    _update(channelContract, callback){
        //Define an empty void if no callback specified
        if(callback === undefined){
            callback = _ => {};
        }

        this.name = channelContract.GroupTitle;
        this.description = channelContract.MessageOfTheDay;

        //Defining voice channel or text channel
        this.isVoiceChannel = (channelContract.GroupMode == groupsModule.GroupMode.TextAndVoice);

        //Create corresponding conversations if doesn't exist
        this.conversation = this.client.conversations.get(channelContract.GroupID);
        if(this.conversation === undefined){
            this.conversation = new conversationsModule.Conversation(
                channelContract.GroupID, conversationsEndpoint.ConversationType.Group, this.client);
        }

        //Save channel contract for debugging/internal use
        this._channelContract = channelContract;

        callback();
    }
}

exports.Channel = Channel;
