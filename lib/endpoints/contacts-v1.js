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
                winston.log('debug', 'contacts-v1.contacts', 'authorization denied', errors.content);
                callback(errors, null);
            } else {
                winston.log('debug', 'contacts-v1.contacts', errors);
                callback(errors, null);
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
            winston.log('debug', 'contacts-v1.user', 'Cannot complete request');
            callback(errors, undefined);
        }
    })
}

exports.contacts = contacts;
exports.user = user;
