'use strict';

var Events = {
    CONNECTED : 'connected',

    /**
     * The event *ready* is triggered when all the servers informations have been loaded and the notification module is ready. This event isn't triggered when the notifier drops and reconnect.
     * @event Client.ready
     */
    READY: 'ready',
    
    NOTIFIER_CONNECTED: 'notifier_connected',

    /**
     * The event *message_received* is triggered everytime the client receive a message, the callback gives a messageNotification as first and only argument.
     * @event Client.message_received
     * @param {MessageNotification}    message     Message received
     */
    MESSAGERECEIVED: 'message_received',

    /**
     * The event *message_edited* is triggered everytime the client receive an edited message, the callback gives a messageNotification as first and only argument.
     * @event Client.message_edited
     * @param {MessageNotification}    message     Message edited
     */
    MESSAGEEDITED: 'message_edited',

    /**
     * The event *message_liked* is triggered everytime the client receive a like, the callback gives a messageNotification as first and only argument.
     * @event Client.message_liked
     * @param {MessageNotification}    message     Message liked
     */
    MESSAGELIKED: 'message_liked',

    /**
     * The event *message_deleted* is triggered everytime the client receive a deleted message, the callback gives a messageNotification as first and only argument.
     * @event Client.message_deleted
     * @param {MessageNotification}    message     Message deleted
     */
    MESSAGEDELETED: 'message_deleted'
}

exports.Events = Events;
