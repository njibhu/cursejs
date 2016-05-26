'use strict';

var Client = require('../lib/index.js').Client;
var app = new Client;

//This is a very basic command handling
app.on('message_received', function(message){
    if(message.content === "!ping"){
        message.reply("pong!");
    }
});

app.run("LOGIN", "PASSWORD");
