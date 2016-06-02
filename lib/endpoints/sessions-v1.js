'use strict';

var req = require('../utils/requests.js');

var host = 'sessions-v1.curseapp.net';

class SessionsRequest {
    constructor(machineKey, platform, deviceID, pushKitToken){
        if(platform === undefined){
            platform = 7; //Platform unknown from curse doc, that's the better fit
        }
        if(deviceID === undefined){
            deviceID = null;
        }
        if(pushKitToken === undefined){
            pushKitToken = null;
        }
        this.MachineKey = machineKey;
        this.Platform = platform;
        this.DeviceID = deviceID;
        this.PushKitToken = pushKitToken;
    }
}

function sessions(sessionRequest, token, callback){
    var options = {
        host: host,
        endpoint: '/sessions',
        token: token
    }
    req.post(options, sessionRequest, function(errors, answer){
        if(errors === null){
            if(answer.content.error === undefined){
                callback(null, answer.content);
            } else {
                callback(answer.content, undefined);
            }
        } else {
            callback(errors, undefined);
        }
    });
}

exports.sessions = sessions;
exports.SessionsRequest = SessionsRequest;
