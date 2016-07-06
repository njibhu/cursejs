'use strict';

var host = "wss://notifications-v1.curseapp.net/";

var TypeID = {
//	ConversationMarkReadRequest: -342895375,
	ConversationMessageRequest: -2124552136,
//	HealthCheckRequest: -1422086075,
	JoinRequest: -2101997347,
	Handshake: -476754606,
//	CallNotification: -1669214322,
//	CallRespondedNotification: -1145188782,
	ConversationMessageNotification: -635182161,
	ConversationMessageResponse: 705131365,
//	ConversationReadNotification: -695526586,
//	ExternalCommunityLinkChangedNotification: 738704822,
//	FriendshipChangeNotification: 580569888,
//	FriendshipRemovedNotification: 1216900677,
//	FriendSuggestionNotification: -1001397130,
//	GroupChangeNotification: 149631008,
//	GroupGiveawayChangedNotification: 1519023790,
//	GroupGiveawaySettingsNotification: -1318725298,
//	GroupInvitationNotification: -1732183626,
//	GroupPollChangedNotification: -1942550100,
//	GroupPollSettingsNotification: -34150280,
//	GroupPreferenceNotification: 72981382,
//	GroupPresenceNotification: 1260535191,
	JoinResponse: -815187584
//	UserChangeNotification: 937250613,
//	UserClientSettingsNotification: -1641871686,
}

var JoinStatus = {
	Successful: 1,
	FailedUnhandledException: 2,
	InvalidClientVersion: 3,
	InvalidSessionID: 4,
	Timeout: 5,
	Throttled: 6
}

class JoinRequest{
    constructor(machinekey, userid, sessionid){
        this.CipherAlgorithm = 0;
        this.CipherStrength = 0;
        this.ClientVersion = '7.0.62';
        this.PublicKey = null;
		this.MachineKey = machinekey;
        this.UserID = userid;
		this.SessionID = sessionid;
		this.Status = 1;
    }
}

class ConversationMessageRequest{
	constructor(conversationid, attachmentid, clientid, message){
		if(attachmentid == ""){
			attachmentid = "00000000-0000-0000-0000-000000000000";
		}
		this.ConversationID = conversationid;
		this.AttachmentID = attachmentid;
		this.ClientID = clientid;
		this.Message = message;
	}
}

exports.host = host;
exports.TypeID = TypeID;
exports.JoinRequest = JoinRequest;
exports.JoinStatus = JoinStatus;
exports.ConversationMessageRequest = ConversationMessageRequest;
