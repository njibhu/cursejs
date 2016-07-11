'use strict';

class Role {
    constructor(id, name, rank, isDefault, server, client){
        this.ID = id;
        this.name = name;
        this.rank = rank;
        this.isDefault = isDefault;
        this.server = server;
        this.client = client;
    }

    isMember(user, callback){
        //TODO Role.isMember function
        //check in api
        //https://groups-v1.curseapp.net/Help/Api/GET-groups-groupID-members-userID
    }

    everyMember(callback){
        //TODO Role.everyMember
        //https://groups-v1.curseapp.net/Help/Api/POST-groups-groupID-members-search
    }


}

exports.Role = Role;
