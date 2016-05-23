'use strict';

exports.Client = require('./client/client.js').Client;
exports.Events = require('./client/events.js').Events;
exports.libversion = "0.1-7032";
exports.version = parseFloat(exports.libversion);
