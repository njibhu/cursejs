'use strict';

var req = require('../core/requests.js');

var host = 'sessions-v1.curseapp.net';

class SessionsRequest {
    constructor(machineKey, platform = 0, deviceID = null, pushKitToken = null){
        this.MachineKey = machineKey;
        this.Platform = platform;
        this.DeviceID = deviceID;
        this.PushKitToken = pushKitToken;
    }
}

function sessions(sessionRequest, token, callback){
    var post_data = sessionRequest;
    req.post(host, '/sessions', post_data, token, callback);
}

exports.sessions = sessions;
exports.SessionsRequest = SessionsRequest;
