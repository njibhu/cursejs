# Changelog

## Version 1.2.0

- **! Breaking change !** The Server.searchUser have been adapted to now return an array of ServerMemberResult instead of custom made objects. This class is fully documented.

- New method Server.getUserInfo returning an object from the new class ServerMemberResult, this class gives a lot of new informations about users on the server.

- **! Breaking change !** The method Client.getUser will now return null when asked for a user with ID 0.

- **! Breaking change !** The Server.getBans have been adapted to now return an array of ServerBan instead of custom made objects. This class is also fully documented.

- New method Server.everyBans allows you to iterate over server bans without having to care about paging results.. It's using the same new class of ServerBan to return information.

- **! Breaking change !** The method Server.banUser have been modified to support IP bans, it now requires a boolean parameter before the callback to set to true or false.

- Library supports now automatic information updates for servers, a new event called server_change have been added, it will trigger when the server notifies the library of a change in channels, roles, or server settings..

- The Channel object have been updated with a set of new properties (documented) to allow better use of this class. DisplayOrder, displayCategoryID, displayCategory, displayCategoryRank, isDefaultChannel, isPublic, urlPath are now usable.

- Message sending have been changed internally to use a queue system. It's now possible to chain a big amount of message without being scared to hurt the throttling limit from curse backend. Everything have been handled automatically.

- Message editions will now less likely to fail when a message have just been received (Works with backend caching).

- Server roles are now available on server private messages. The senderVanityRole and senderRoles are not undefined anymore when receiving a private message in a server.

- The "@everyone" mentions won't break the notifications anymore, it won't be inside the MessageNotification.mentions array but a new property called atEveryoneMention have been added. This boolean is set to true when the message is a global mention.
