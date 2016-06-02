'use strict';

var https = require('https');
var querystring = require('querystring');

/**
 * Make a request to a specified enpoint
 * @param  {string}   type     Type of request
 * @param  {object}   options  {host: string, endpoint: string, token: string|undefined, payload: object|undefined}
 * @param  {Function} callback function(errors, {code: {int},content: {str}}){}
 */
function request(type, options, callback){
    var buffer = "";

    var request_options = {
        host: options.host,
        port: '443',
        path: options.endpoint,
        method: type,
        headers: {}
    }

    // Add token to header if provided
    if(options.token != undefined){
        request_options['headers']['authenticationtoken'] = options.token;
    }

    //Modify request if POST
    if(type == 'POST'){
        var payload = querystring.stringify(options.payload);
        request_options['headers']['Content-Type'] = 'application/x-www-form-urlencoded';
        request_options['headers']['Content-Length'] = Buffer.byteLength(payload);
    }

    //Add callback when request is completed
    var req = https.request(request_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            buffer += chunk;
        });
        res.on('end', function(){
            //Check for answer validity and start callback
            if(res.statusCode >= 200 && res.statusCode < 300){
                try {
                    buffer = JSON.parse(buffer);
                }
                finally {
                    callback(null, {code: res.statusCode, content: buffer});
                }
            }
            else {
                try {
                    buffer = JSON.parse(buffer);
                }
                finally {
                    callback({code: res.statusCode, content: buffer}, undefined);
                }
            }
        });
    });
    //Or when request have an error
    req.on('error', function(e){
        callback(e, undefined);
    });

    //Send payload in POST requests
    if(type == 'POST'){
        req.write(payload);
    }

    req.end();

}

/**
 * HTTPS get request to a specified endpoint
 * @param  {object}     parameters  An option object looking like {host: "", endpoint: "", token: ""}
 * @param  {Function}   callback    A function like: function(errors, {code: {int},content: {str}}){}
 */
function get(parameters, callback){
    request('GET', parameters, callback);
}

/**
 * HTTPS post request to a specified endpoint
 * @param  {object}     parameters  An option object looking like {host: "", endpoint: "", token: "", payload: {}}
 * @param  {Function}   callback    A function like: function(errors, {code: {int},content: {str}}){}
 */
function post(parameters, payload, callback){
    parameters['payload'] = payload;
    request('POST', parameters, callback);
}

/**
 * HTTPS get request to a specified endpoint
 * @param  {object}     parameters  An option object looking like {host: "", endpoint: "", token: ""}
 * @param  {Function}   callback    A function like: function(errors, {code: {int},content: {str}}){}
 */
function del(parameters, callback){
    request('DELETE', parameters, callback);
}

exports.get = get;
exports.post = post;
exports.del = del;
