# Class Client

Client class is the main application class, it's the core of the library that makes all works together. A client represent a user connection to curse servers, it handles the main events that occurs at run time and expose them to a third party application.
The Client class extends the [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter) class.


## Properties

### Client.servers
Client.servers is a [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) instance that regroup all the servers fetched when the client starts. This map is filled only when using the client.run method.
The keys are the servers IDs and the values are instances of the [Server](./servers.md) class.

### Client.channels
Client.channels is a [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) instance that regroup all the channels fetched from all the servers when the client starts. This map is filled only when using the client.run method.
The keys are the channels IDs and the values are instances of the [Channel](./channels.md) class.

### Client.conversations
Client.conversations is a [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) instance that regroup all the conversations that the client encounters during its run time.
The keys are the conversations IDs and the values are instances of the [Conversation](./conversations.md) class.

### Client.users
Client.users is a [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) instance that regroup all the users that the client encounters during its run time.
The keys are the users IDs and the values are instances of the [User](./users.md) class.

### Client.messagesCache

### Client.clientID

### Client.serverList

### Client.username


## Functions

### Client.login

### Client.run

### Client.sendMessage


## Events

### ready

### message_received

### message_liked

### message_edited

### message_deleted
