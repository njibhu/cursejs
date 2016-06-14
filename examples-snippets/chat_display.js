'use strict';

var cursejs = require('../lib/index.js');
var client = new cursejs.Client;

//Show the current received messages !
client.on('message_received', function(message){
    //Will display the conversation ID if not a message in a channel
    var prefix = message.conversation.ID;
    //Look for a channel corresponding to the conversation ID
    if(client.channels.has(message.conversation.ID)){
        prefix = client.channels.get(message.conversation.ID).name;
    }
    console.log(prefix, "[", message.senderName, "]", ": ", message.content);
});

client.run("LOGIN", "PASSWORD");
