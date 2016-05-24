'use strict';

var https = require('https');
var querystring = require('querystring');

function get(host, endpoint, token = undefined, callback){
    //Incomming data from server
    var data = "";

    //Callback is in the end as a convention, make sure everything is good when token is not used
    if(typeof(callback) == 'undefined'){
        callback = token;
        token = undefined;
    }

    var get_options = {
        host: host,
        port: '443',
        path: endpoint,
        method: 'GET'
    };

    // Add token to header if provided
    if(typeof(token) != 'undefined'){
        get_options['headers'] = {
            'authenticationtoken': token
        }
    }

    //Add callback when request is completed
    var get_req = https.request(get_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            if(data == ""){
                data = "{}";
            }
            callback(JSON.parse(data));
        });
    });

    get_req.end();
}

function post(host, endpoint, post_data, token = undefined, callback){
    //Incomming data from server
    var data = "";

    //Callback is in the end as a convention, make sure everything is good when token is not used
    if(typeof(callback) == 'undefined'){
        callback = token;
        token = undefined;
    }

    //Stringify is done here because the header is x-www-form-urlencoded, and we want to be sure request is correct
    post_data = querystring.stringify(post_data);
    var post_options = {
        host: host,
        port: '443',
        path: endpoint,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(post_data),
        }
    };

    // Add token to header if provided
    if(typeof(token) != 'undefined'){
        post_options.headers['authenticationtoken'] = token;
    }

    var post_req = https.request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            if(data == ""){
                data = "{}";
            }
            callback(JSON.parse(data));
        });
    });

    post_req.write(post_data);
    post_req.end();
}

exports.get = get;
exports.post = post;
