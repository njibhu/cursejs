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
        if(errors === null && answer.code === 200){
            var data = JSON.parse(answer.content);
            //Login is correct when status = 1
            if(data.Status === 1){
                callback(null, data);
            } else {
                callback(data, undefined);
            }
        }
        else if(errors === null){
            callback(answer, undefined);
        }
        else{
            winston.log('error', 'logins-v1.login', errors);
            callback(errors, undefined);
        }
    });
}

function loginRenew(renewTokenResponseContract, token, callback){
    req.post({host: host, endpoint: '/login/renew'}, renewTokenResponseContract,
        function(errors, answer){
            console.log(renewTokenResponseContract);
            if(errors === null && answer.code === 200){
                var data = JSON.parse(answer.content);
                //Login is correct when status = 1
                if(data.Status === 1){
                    callback(null, data);
                } else {
                    callback(data, undefined);
                }
            }
            else if(errors === null){
                callback(answer, undefined);
            }
            else{
                winston.log('error', 'logins-v1.login', errors);
                callback(errors, undefined);
            }
        });
}


exports.login = login;
exports.loginRenew = loginRenew;
exports.LoginRequest = LoginRequest;
exports.RenewTokenResponseContract = RenewTokenResponseContract;
