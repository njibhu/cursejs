'use strict';

var req = require('../utils/requests.js');
var winston = require('winston');

var host = 'logins-v1.curseapp.net';

//Post data
class LoginRequest {
    constructor(login, password){
        this.Username = login;
        this.Password = password;
    }
}

function login(loginRequest, callback){
    req.post({host: host, endpoint: '/login'}, loginRequest, function(errors, answer){
        if(errors === null){
            //Login is correct when status = 1
            if(answer.content.Status === 1){
                callback(null, answer.content);
            } else {
                callback(answer.content, undefined);
            }
        }
        else{
            winston.log('debug', 'logins-v1.login', 'Cannot complete request');
            callback(errors, undefined);
        }
    });
}

function loginRenew(token, callback){
    var parameters = {
        host: host,
        endpoint: '/login/renew',
        token: token
    }
    req.post(parameters, null, function(errors, answer){
        if(errors === null){
            callback(null, answer);
        }
        else {
            winston.log('debug', 'logins-v1.loginRenew', 'Cannot complete request');
            callback(errors, undefined);
        }
    });
}


exports.login = login;
exports.loginRenew = loginRenew;
exports.LoginRequest = LoginRequest;
