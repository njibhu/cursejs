'use strict';

var cursejs = require('./lib/index.js');
var client = new cursejs.Client;

//This is a very basic command handling
client.on('message_received', function(message){
    if(message.content == "!ping"){
        message.conversation.sendMessage("Bonjour " + message.senderName + "!");
    }
})

client.run("LOGIN", "PASSWORD");
