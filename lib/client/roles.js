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
    }


}

exports.Role = Role;
