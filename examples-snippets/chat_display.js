'use strict';

var cursejs = require('../lib/index.js');
var client = new cursejs.Client;

var serverChannels = {};

//we're just registering all the conversations ID into on object here
//Because we can't have directly channel names from conversations
//So we register all channels into one variable
//And see if a conversation correspond to it inside the message_received handler
client.on('ready', function(){
    Object.keys(client.serverList).forEach(function(skey){
        var server = client.serverList[skey];
        Object.keys(server.channelList).forEach(function(cKey){
            var channel = server.channelList[cKey];
            serverChannels[channel.ID] = channel;
        });
    });
});

//Show the current received messages !
client.on('message_received', function(message){
    var prefix = message.conversation.ID;
    if(serverChannels[message.conversation.ID] != undefined){
        prefix = serverChannels[message.conversation.ID].name;
    }
    console.log(prefix, "[", message.senderName, "]", ": ", message.content);
});

client.run("LOGIN", "PASSWORD");
