'use strict';

var Events = {
    CONNECTED : 'connected',
    READY: 'ready',
    WS_AUTHORIZED: 'ws_authorized',
    WS_CONNECTED: 'ws_connected',
    NOTIFIER_CONNECTED: 'notifier_connected',
    MESSAGERECEIVED: 'message_received',
    MESSAGEEDITED: 'message_edited',
    MESSAGELIKED: 'message_liked',
    MESSAGEDELETED: 'message_deleted'
}

exports.Events = Events;
