'use strict';

var Client = require('../lib/index.js').Client;
var app = new Client;

var regex = /([A-Za-z0-9]+\.){1,3}([A-Za-z0-9]{2,20})/

function removeLink(message){
    if(message.conversation.ID === "channel-conversation-id"){
        var results = message.content.match(regex);
        if(results != null){
            message.deleteMessage();
            console.log("Message deleted:", message.senderName, message.content);
        }
    }
}

app.on('message_received', function(message){
    removeLink(message);
});

app.on('message_edited', function(message){
    removeLink(message);
});

app.run("LOGIN", "PASSWORD");
