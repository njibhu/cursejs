'use strict';

var req = require('../utils/requests.js');
var winston = require('winston');

var host = 'contacts-v1.curseapp.net';

function contacts(token, callback){
    req.get({host: host, endpoint: '/contacts', token: token}, function(errors, answer){
        if(errors === null && answer.code === 200){
            var data = JSON.parse(answer.content);
            callback(null, data);
        } else if(answer.code === 401) {
            winston.log('error', 'contacts-v1.contacts', 'authorization denied', answer.content);
            callback(401, undefined);
        } else {
            winston.log('error', 'contacts-v1.contacts', answer);
            callback(errors, undefined);
        }
    })
}

exports.contacts = contacts;
