'use strict';

var fs = require('fs');

//This function comes from curselib
function newGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getMachineKey(){
    var machinekey = require('./machine_key.json').machineKey;
    if(typeof(machinekey) == 'undefined'){
        machinekey = newGuid();
        var fileContent = JSON.stringify({machineKey: machinekey});
        fs.writeFile(__dirname + '/machine_key.json', fileContent);
    }
    return machinekey;
}

exports.newGuid = newGuid;
exports.getMachineKey = getMachineKey;
