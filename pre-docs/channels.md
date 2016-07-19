# Class Channel
The **Channel** class represent a voice or text only channel in a Curse server.
On Curse side, **Conversations** and **Channels** are exactly the same thing, but on the lib side, the text part of the channel is handled by the [Conversation](./conversations.md) Class and the channel informations itself by the Channel class.

## Properties

### Channel.ID
**Channel.ID** is a **string** containing a Curse UUID of the specified **Channel**. This ID is shared with the corresponding conversation.

### Channel.client
**Channel.client** is the [Client](./client.md) object used to create this **Channel** instance.

### Channel.name
**Channel.name** is a **string** containing the name of the **Channel**.

### Channel.description
**Channel.description** is a **string** containing the description of the **Channel**.

### Channel.isVoiceChannel
**Channel.isVoiceChannel** is a **boolean** specifying the type of the **Channel**.

### Channel.conversation
**Channel.conversation** is the corresponding conversation object of the **Channel**.
