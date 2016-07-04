'use strict';

var Client = require('../lib/index.js').Client;
var app = new Client;

//Basic example how to scroll back a channel history
app.on('ready', function(){
    //Get the channel we want to scroll history
    var myChannel = app.conversations.get('my-channel-id');

    //Counter is here only for demo purposes
    var counter = 0;
    myChannel.everyHistoryMessages(function(errors, message, done){
        if(errors == null && !done){

            //We can handle message history like message notifications
            console.log(message.serverTimestamp, message.senderName, message.content);

            if(counter == 123){
                //This will stop the scrolling after 123messages
                return false;
            }
            counter += 1;
        }
    });
});

app.run("LOGIN", "PASSWORD");
