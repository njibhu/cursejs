'use strict';

var req = require('../utils/requests.js');

var host = 'contacts-v1.curseapp.net';

function contacts(token, callback){
    req.get(host, '/contacts', token, callback);
}

exports.contacts = contacts;
