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

class RenewTokenResponseContract {
    constructor(token, expires, renewafter){
        this.Token = token;
        this.Epires = expires;
        this.RenewAfter = renewafter;
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
            winston.log('error', 'logins-v1.login', 'Cannot complete request');
            callback(errors, undefined);
        }
    });
}

function loginRenew(renewTokenResponseContract, token, callback){
    req.post({host: host, endpoint: '/login/renew'}, renewTokenResponseContract,
        function(errors, answer){
            if(errors === null){
                //Login is correct when status = 1
                if(answer.content.Status === 1){
                    callback(null, answer.content);
                } else {
                    callback(answer.content, undefined);
                }
            }
            else{
                winston.log('error', 'logins-v1.loginRenew', 'Cannot complete request');
                callback(errors, undefined);
            }
        });
}


exports.login = login;
exports.loginRenew = loginRenew;
exports.LoginRequest = LoginRequest;
exports.RenewTokenResponseContract = RenewTokenResponseContract;
