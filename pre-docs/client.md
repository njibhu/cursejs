# Class Client

**Client** class is the main application class, it's the core of the library that makes all works together. A **Client** represent a user connection to curse servers, it handles the main events that occurs at run time and expose them to a third party application.
The **Client** class extends the [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter) class.


## Properties

### Client.servers
**Client.servers** is a [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) instance that regroup all the servers fetched when the client starts. This map is filled only when using the client.run method.
The keys are the servers IDs and the values are instances of the [Server](./servers.md) class.

### Client.channels
**Client.channels** is a [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) instance that regroup all the channels fetched from all the servers when the client starts. This map is filled only when using the client.run method.
The keys are the channels IDs and the values are instances of the [Channel](./channels.md) class.

### Client.conversations
**Client.conversations** is a [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) instance that regroup all the conversations that the client encounters during its run time.
The keys are the conversations IDs and the values are instances of the [Conversation](./conversations.md) class.

### Client.users
**Client.users** is a [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) instance that regroup all the users that the client encounters during its run time.
The keys are the users IDs and the values are instances of the [User](./users.md) class.

### Client.clientID
**Client.ClientID** is a **number** containing the curse ID of the connected client. This is very helpful for example to check the ID of the for notificationMessages and ignore self sended messages.

### Client.username
**Client.ClientID** is a **string** containing the curse username of the connected client.


## Functions

### Client.login
**Client.login(login, password, callback)**
The **Client.login** function will take your *login* and *password* as two arguments and a callback when done. This function will not get any server information ready, and will neither start the notifier from the notification module making impossible to receive and send new messages. For general use the **Client.run** function.

### Client.run
**Client.run(login, password)**
The **Client.run** function will take your *login* and *password* as two arguments but no callback. The **Client** class will emit the *ready* event when the client is connected and ready.

### Client.sendMessage
**Client.sendMessage(conversation, content, callback)**
This **Client.sendMessage** function will take a [Conversation](./conversations.md) object as *converation* argument, and a string as content for the message text and will send a message to the specified *conversation*. Once done, the *callback* will be called with the argument *errors* as null if everything went correctly.

### Client.redeemInvitation


## Events

### ready
The event *ready* is triggered when all the servers informations have been loaded and the notification module is ready. This event isn't triggered when the notifier drops and reconnect.

### message_received
The event *message_received* is triggered everytime the client receive a message, the callback gives a messageNotification as first and only argument.

### message_liked
The event *message_liked* is triggered everytime the client receive a like, the callback gives a messageNotification as first and only argument.

### message_edited
The event *message_edited* is triggered everytime the client receive an edited message, the callback gives a messageNotification as first and only argument.

### message_deleted
The event *message_deleted* is triggered everytime the client receive a deleted message, the callback gives a messageNotification as first and only argument.
