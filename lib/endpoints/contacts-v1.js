'use strict';

var req = require('../utils/requests.js');
var winston = require('winston');

var host = 'contacts-v1.curseapp.net';

function contacts(token, callback){
    req.get({host: host, endpoint: '/contacts', token: token}, function(errors, answer){
        if(errors === null){
            callback(null, answer.content);
        }
        else {
            //401 means authorization denied
            if(errors.code == 401){
                winston.log('error', 'contacts-v1.contacts', 'authorization denied', errors.content);
            } else {
                winston.log('error', 'contacts-v1.contacts', errors);
            }
        }
    })
}

function user(userID, token, callback){
    var parameters = {
        host: host,
        endpoint: '/users/' + userID,
        token: token
    }
    req.get(parameters, function(errors, answer){
        if(errors === null){
            callback(null, answer);
        }
        else {
            winston.log('error', 'contacts-v1.user', 'Cannot complete request');
            callback(errors, undefined);
        }
    })
}

exports.contacts = contacts;
exports.user = user;
