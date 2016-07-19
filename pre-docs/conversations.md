# Class Conversation
The **Conversation** class represent a conversation between one or multiple person on Curse. It can be a small group conversation, a server channel conversation, a server private conversation, a friend conversation, or a adhoc conversation. If it's a server channel conversation then the channel property is set to the corresponding channel.

## Properties

### Conversation.ID
**Conversation.ID** is a **string** containing a Curse UUID of the specified **Conversation**. This ID is shared with the corresponding channel if it's a server channel conversation.

### Conversation.client
**Conversation.client** is the [Client](./client.md) object used to create this **Conversation** instance.

### Conversation.conversationType
**Conversation.conversationType** is an int following the groups-v1 **ConversationType** endpoint definition. Friendship = 0, Group = 1, AdHoc = 2, GroupPrivateConversation = 3.

### Conversation.channel
**Conversation.channel** is the corresponding channel object of the **Conversation** **if and only if the Conversation is a Group conversation (aka channel in a server)**.

## Functions

### Conversation.getHistory

### Conversation.sendMessage

### Conversation.editMessage

### Conversation.deleteMessage
