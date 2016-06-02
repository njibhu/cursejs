'use strict';

var Client = require('../lib/index.js').Client;
var app = new Client;

var regex = /(?:(ftp|http|https):\/\/)?(?:[\w-]+\.)+[a-z]{2,8}/;

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
