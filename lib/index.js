'use strict';

var winston = require('winston');
winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, {
    level: 'debug',
    prettyPrint: true,
    colorize: true,
    silent: false,
    timestamp: true
});

exports.Client = require('./client/client.js').Client;
exports.Events = require('./client/events.js').Events;
exports.libversion = "0.1-7032";
exports.version = parseFloat(exports.libversion);
