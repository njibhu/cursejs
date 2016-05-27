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
        if(errors === null && answer.code === 200){
            var data = JSON.parse(answer.content);
            //Check the answer if the session have been accepted or not
            if(data.error == undefined){
                callback(null, data);
            } else {
                callback(data, undefined);
            }
        } else if(errors === null){
            callback(answer, undefined);
        } else {
            callback(errors, undefined);
        }
    });
}

exports.sessions = sessions;
exports.SessionsRequest = SessionsRequest;
