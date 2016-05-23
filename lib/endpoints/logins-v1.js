'use strict';

var req = require('../core/requests.js');

var host = 'logins-v1.curseapp.net';

//Post data
class LoginRequest {
    constructor(login, password){
        this.Username = login;
        this.Password = password;
    }
}

function login(loginRequest, callback){
    var post_data = loginRequest;

    req.post(host, '/login', post_data, callback);
}

//function loginRenew(token, expires, )


exports.login = login;
exports.LoginRequest = LoginRequest;
