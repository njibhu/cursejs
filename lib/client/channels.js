'use strict';

const assert = require('assert');
var winston = require('winston');

var groupsModule = require('../endpoints/groups-v1.js');
var conversationsEndpoint = require('../endpoints/conversations-v1.js');
var conversationsModule = require('./conversations.js');


/**
 * @class Channel
 * @description The [Channel]{@link Channel} class represent a voice or text only channel in a Curse server.
   On Curse side, [Conversations]{@link Conversation} and [Channels]{@link Channel} are exactly the same thing, but on the lib side,
   the text part of the channel is handled by the [Conversation]{@link Conversation} Class and the channel
   informations itself by the Channel class.
 * @property    {string}        ID                      Curse UUID of the specified [Channel]{@link Channel}. This ID is shared with the corresponding conversation.
 * @property    {Client}        client                  [Client]{@link Client} object used to create this [Channel]{@link Channel} instance.
 * @property    {string}        name                    The name of the current [Channel]{@link Channel}.
 * @property    {string}        description             The description of the current [Channel]{@link Channel}.
 * @property    {Server}        server                  The [Server]{@link Server} where the current channel is located.
 * @property    {boolean}       isVoiceChannel          False when the channel is a text only channel.
 * @property    {Conversation}  conversation            Corresponding [Conversation]{@link Conversation} object of the [Channel]{@link Channel}.
 * @property    {number}        displayOrder            Position of the channel in the channel list
 * @property    {string}        displayCategoryID       Curse UUID of the display category
 * @property    {string}        displayCategory         Name of the display category
 * @property    {number}        displayCategoryRank     Position of the display Category in channel list
 * @property    {boolean}       isDefaultChannel        True if it's the default channel of the server
 * @property    {boolean}       isPublic                True if anyone can access it
 * @property    {string}        urlPath                 Url path of the channel
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

    /*
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

        this.displayOrder = channelContract.DisplayOrder;
        this.displayCategoryID = channelContract.DisplayCategoryID;
        this.displayCategory = channelContract.DisplayCategory;
        this.displayCategoryRank = channelContract.DisplayCategoryRank;
        this.isDefaultChannel = channelContract.IsDefaultChannel;
        this.isPublic = channelContract.IsPublic;
        this.urlPath = channelContract.UrlPath;

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

    rename(new_name, callback){
        //TODO: rename channel function
    }
}

exports.Channel = Channel;
