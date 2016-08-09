var qs = require('querystring');

module.exports = Parse;

/**
 * options: {
 *   app_id: string,
 *   master_key: string,
 *   https: boolean, // set false to use without https
 *   host: string, // your host without http/https
 *   port: int, // port of your server
 *   api_version: string, // set to use something like /parse/classes or /1/classes or "" to direct server
 * }
 */
function Parse(options_or_application_id, master_key) {
    this._options = {};
    if (master_key) {
        this._options.app_id = options_or_application_id;
        this._options.master_key = master_key;
    } else {
        this._options = options_or_application_id;
        this._api_protocol = this._options.https === false ? require('http') : require('https');
        
        this._api_port = this._options.port ? this._options.port : 443;
        if(this._options.host) {
            this._api_host = this._options.host;
            this._api_version = this._options.api_version !== null ? this._options.api_version : '/parse' ;
        }
    }
}

Parse.prototype = {
    _api_protocol: require('https'),
    _api_host: 'api.parse.com',
    _api_port: 443,
    _api_version: '/1',

    // add object to class store
    insert: function (className, object, callback) {
        parseRequest.call(this, 'POST', this._api_version + '/classes/' + className, object, callback);
    },

    // add files
    insertFile: function(fileName, data, contentType, callback){
        parseRequest.call(this, 'POST', this._api_version + '/files/' + fileName, data, callback, contentType);
    },

    // create a new user
    insertUser: function (data, callback) {
        parseRequest.call(this, 'POST', this._api_version + '/users/', data, callback);
    },

    findWithObjectId: function (className, objectId, callback){
        var url = this._api_version + '/' + (className === '_User' ? 'users' : 'classes/' + className + '/' + objectId);


        parseRequest.call(this, 'GET', url, null, callback);

    },
    // get an object from the class store
    find: function (className, query, callback) {
        var url = this._api_version + '/' + (className === '_User' ? 'users' : 'classes/' + className);
        var queryType = typeof query;
        var query = JSON.parse(JSON.stringify(query)); // deep clone object
        if ( queryType === 'string' ) {
            url += '/' + query;
        } else if ( queryType === 'object' ) {

            // if the user wants to add 'include' or 'key' (or other types of) constraints while getting only one object
            // objectId can be added to the query object and is deleted after it's appended to the url
            if ( query.hasOwnProperty('objectId') ) {
                url += '/' + query.objectId;
                delete query.objectId;
            }

            // check to see if there is a 'where' object in the query object
            // the 'where' object need to be stringified by JSON.stringify(), not querystring
            if ( query.hasOwnProperty('where') ) {
               url += '?where=' + encodeURIComponent(JSON.stringify(query.where));
                delete query.where;
            }

            // if there are no more constraints left in the query object 'remainingQuery' will be an empty string
            var remainingQuery = qsStringify(query);
            if ( remainingQuery ) {
                url += ( url.indexOf('?') === -1 ? '?' : '&' ) + remainingQuery;
            }

        }
        parseRequest.call(this, 'GET', url, null, callback);
    },

    // get a collection of objects
    findMany: function (className, query, order, limit, skip, callback) {
        console.warn('"findMany" is deprecated, use "find" instead.');

        switch ( arguments.length ) {
            case 3: callback = order;
                    break;
            case 5: query.order = order;
                    query.limit = limit;
                    callback = skip;
                    break;
            case 6: query.order = order;
                    query.limit = limit;
                    query.skip = skip;
                    break;
            default: throw new Error('Unexpected number of arguments.');
        }

        this.find(className, query, callback);
    },

    // do a batch of requests at once
    batch: function (requests,callback) {
        parseRequest.call(this,'POST',this._api_version + '/batch',{requests:requests},callback);
    },

    // user login
    loginUser: function (username, password, callback) {
        parseRequest.call(this, 'GET', this._api_version + '/login/?username=' + username + '&password=' + password, null, callback);
    },

    // user logout
    logoutUser: function (sessionToken, callback) {
        parseRequest.call(this, 'POST', this._api_version + '/logout', null, callback, null, sessionToken);
    },

    // retrieve current user
    me: function (sessionToken, callback) {
        parseRequest.call(this, 'GET', this._api_version + '/users/me', null, callback, null, sessionToken);
    },

    // retrieve contents of one or more user objects
    findUser: function (query, callback) {
        if ( arguments.length !== 2 ) {
            throw new Error('Unexpected number of arguments.');
        } else {
            this.find('_User', query, callback);
        }
    },

    // get an object belonging to a certain User
    findFileByUser: function(userId, className, callback) {
        queryString = 'where={"user":' + '"' + userId + '"' + '}';
        encodedString = encodeURIComponent(queryString);
        parseRequest.call(this, 'GET', this._api_version + '/classes/' + className + '?' + encodedString, null, callback);
    },

    getUser: function (query, callback, deprecatedCallback) {
        console.warn('getUser is deprecated, user findUser instead.');
        if ( arguments.length === 3 ) {
            console.warn('Logging in with "getUser" is deprecated, use loginUser instead.');
            console.warn('Use "findUser" to retrieve one or more user object contents.');
            this.loginUser(query, callback, deprecatedCallback);
        } else {
            this.findUser(query, callback);
        }
    },

    getFileByUser: function(userId, className, callback) {
        console.warn('getFileByUser is deprecated, user findFileByUser instead.');
        this.findFileByUser(userId, className, callback);
    },

    // insert an object into Parse
    insertCustom: function (className, object, callback) {
        parseRequest.call(this, 'POST', this._api_version + '/' + className, object, callback);
    },

    // update an object in the class store
    update: function (className, objectId, object, callback) {
        parseRequest.call(this, 'PUT', this._api_version + '/classes/' + className + '/' + objectId, object, callback);
    },

    // update a User object's email address
    updateUserEmail: function(objectId, data, sessionToken, callback) {
        switch ( arguments.length ) {
            case 3: callback = sessionToken;
                    break;
            case 4: break;
            default: throw new Error('Unexpected number of arguments.');
        }
        data = { email: data };
        parseRequest.call(this, 'PUT', this._api_version + '/users/' + objectId, data, callback, null, sessionToken);
    },

    // update a User object's username*
    updateUserName: function(objectId, data, sessionToken, callback) {
        switch ( arguments.length ) {
            case 3: callback = sessionToken;
                    break;
            case 4: break;
            default: throw new Error('Unexpected number of arguments.');
        }
        data = { username: data };
        parseRequest.call(this, 'PUT', this._api_version + '/users/' + objectId, data, callback, null, sessionToken);
    },

    // update any keys of a User object
    updateUser: function (objectId, data, sessionToken, callback) {
        switch ( arguments.length ) {
            case 3: callback = sessionToken;
                    break;
            case 4: break;
            default: throw new Error('Unexpected number of arguments.');
        }
        parseRequest.call(this, 'PUT', this._api_version + '/users/' + objectId, data, callback, null, sessionToken);
    },

    // reset a User object's password
    passwordReset: function (data, callback) {
        data = { email: data };
        parseRequest.call(this, 'POST', this._api_version + '/requestPasswordReset', data, callback);
    },

    // remove an object from the class store
    delete: function (className, objectId, callback) {
        parseRequest.call(this, 'DELETE', this._api_version + '/classes/' + className + '/' + objectId, null, callback);
    },

    // remove an object from the class store
    deleteUser: function (objectId, sessionToken, callback) {
        switch ( arguments.length ) {
            case 2: callback = sessionToken;
                    sessionToken = null;
                    break;
            case 3: break;
            default: throw new Error('Unexpected number of arguments');
        }
        parseRequest.call(this, 'DELETE', this._api_version + '/users/' + objectId, null, callback, null, sessionToken);
    },

    deleteAll: function(className, callback){
        var that = this;
        this.find(className, '', function (err, response) {
            var requests = toDeleteOps(className, response.results);
            that.batch(requests, callback);
        });
    },

    deleteAllUsers: function(callback){
        var that = this;
        this.find('_User', '', function (err, response) {
            var requests = toDeleteOps('_User', response.results);
            that.batch(requests, callback);
        });
    },

    // upload installation data
    insertInstallationData: function (deviceType, deviceToken, callback) {
        if (deviceType === 'ios'){
            data = { deviceType: deviceType, deviceToken: deviceToken };
        }
        else {
            data = { deviceType: deviceType, installationId: deviceToken };
        }
        parseRequest.call(this, 'POST', this._api_version + '/installations/', data, callback);
    },

    insertInstallationDataWithTimeZone: function (deviceType, deviceToken, timeZone, callback) {
        if (deviceType === 'ios'){
            data = { deviceType: deviceType, deviceToken: deviceToken, timeZone: timeZone };
        }
        else {
            data = { deviceType: deviceType, installationId: deviceToken, timeZone: timeZone };
        }
        parseRequest.call(this, 'POST', this._api_version + '/installations/', data, callback);
    },

    insertInstallationDataWithChannels: function (deviceType, deviceToken, channels, callback) {
        if (deviceType === 'ios'){
            data = { deviceType: deviceType, deviceToken: deviceToken, channels: channels };
        }
        else {
            data = { deviceType: deviceType, installationId: deviceToken, channels: channels };
        }
        parseRequest.call(this, 'POST', this._api_version + '/installations/', data, callback);
    },

    insertInstallationDataWithTimeZoneAndChannels: function (deviceType, deviceToken, timeZone, channels, callback) {
        if (deviceType === 'ios'){
            data = { deviceType: deviceType, deviceToken: deviceToken, timeZone: timeZone, channels: channels };
        }
        else {
            data = { deviceType: deviceType, installationId: deviceToken, timeZone: timeZone, channels: channels };
        }
        parseRequest.call(this, 'POST', this._api_version + '/installations/', data, callback);
    },

    updateInstallationDataChannels: function(objectId, channels, callback) {
        parseRequest.call(this, 'PUT', this._api_version + '/installations/' + objectId, {
            channels: channels
        }, callback);
    },

    getInstallationData: function(callback) {
        parseRequest.call(this, 'GET', this._api_version + '/installations', null, callback);
    },

    getInstallationDataForDeviceToken: function(deviceToken, callback) {
        parseRequest.call(this, 'GET', this._api_version + '/installations?where={"deviceToken":"'+deviceToken+'"}', null, callback);
    },

    deleteInstallation: function(objectId, callback) {
      parseRequest.call(this, 'DELETE', this._api_version + '/installations/' + objectId, null, callback);
    },

    upsertInstallation: function(deviceType, deviceToken, data, callback) {
        data.deviceType = deviceType;
        data.deviceToken = deviceToken;
        parseRequest.call(this, 'POST', this._api_version + '/installations', data, callback);
    },

    insertOrUpdateInstallationDataWithChannels: function(deviceType, deviceToken, channels, callback) {
        var that = this;
        this.getInstallationDataForDeviceToken(deviceToken, function(err, results) {
            if (!err && results.results.length) {
                that.updateInstallationDataChannels(results.results[0].objectId, channels);
                return;
            }
            that.insertInstallationDataWithChannels(deviceType, deviceToken, channels, callback);
        });
    },

    countObjects: function (className, query, callback) {
        if (typeof(query) === "function") {
            parseRequest.call(this, 'GET', this._api_version + '/classes/' + className, null, query);
        }
        if (typeof(query) === "string") {
            parseRequest.call(this, 'GET', this._api_version + '/classes/' + className + '/' + query, null, callback);
        } else {
            parseRequest.call(this, 'GET', this._api_version + '/classes/' + className, { where: JSON.stringify(query) }, callback);
        }
    },

    addRelation: function( relationName, className1, objectId1, className2, objectId2, callback) {
        data = {};
        data[relationName] = { __op:"AddRelation",objects:[{__type:"Pointer",className:className2,objectId:objectId2}]};
        parseRequest.call(this,'PUT',this._api_version + '/classes/' + className1+'/'+objectId1,data,callback);
    },

    removeRelation: function( relationName, className1, objectId1, className2, objectId2, callback) {
        data = {};
        data[relationName] = { __op:"RemoveRelation",objects:[{__type:"Pointer",className:className2,objectId:objectId2}]};
        parseRequest.call(this,'PUT',this._api_version + '/classes/' + className1+'/'+objectId1,data,callback);
    },


    insertRole: function (data, callback) {
        parseRequest.call(this, 'POST', this._api_version + '/roles/', data, callback);
    },

    getRole: function (objectId, callback) {
        parseRequest.call(this, 'GET', this._api_version + '/roles/' + objectId, null, callback);
    },

    getRoles: function (params, callback) {
        if (typeof(params) === "function") {
            parseRequest.call(this, 'GET', this._api_version + '/roles/', null, params);
        }
        if (typeof(params) === "string") {
            parseRequest.call(this, 'GET', this._api_version + '/roles/' + params, null, callback);
        } else {
            params = JSON.stringify(params);
            parseRequest.call(this, 'GET', this._api_version + '/roles/', params, callback);
        }
    },

    updateRole: function (objectId, data, callback) {
        parseRequest.call(this, 'PUT', this._api_version + '/roles/' + objectId, data, callback);
    },

    deleteRole: function (objectId, callback) {
        parseRequest.call(this, 'DELETE', this._api_version + '/roles/' + objectId, callback);
    },

    sendPush: function (data, callback) {
        parseRequest.call(this, 'POST', this._api_version + '/push/', data, callback);
    },

    getCurrentSession: function(objectId, callback)
    {
      parseRequest.call(this, 'GET', this._api_version + '/sessions/'+ objectId, callback);
    }

};

// Parse.com https api request
function parseRequest(method, path, data, callback, contentType, sessionToken) {
    var headers = {
        Connection: 'Keep-alive'
    };

    if(this._options.master_key){
        var auth = 'Basic ' + new Buffer(this._options.app_id + ':' + this._options.master_key).toString('base64');
        headers.Authorization = auth;
        if ( sessionToken ) {
            throw new Error('Can\'t use session tokens while using the master key.');
        }
    }else if(this._options.api_key){
        headers['X-Parse-Application-Id'] = this._options.app_id;
        headers['X-Parse-REST-API-Key'] = this._options.api_key;
        if ( sessionToken ) {
            headers['X-Parse-Session-Token'] = sessionToken;
        }
    }

    if(!sessionToken && this._options && this._options.session_token){
        headers['X-Parse-Session-Token'] = this._options.session_token;
    }


    var body = null;

    switch (method) {
        case 'GET':
            if (data) {
                path += (path.indexOf("?") == -1 ? '?' : '&') + qsStringify(data);
            }
            break;
        case 'POST':
        case 'PUT':
            body = contentType ? data : typeof data === 'object' ? JSON.stringify(data) : data;
            if ( !contentType ) {
                headers['Content-length'] = Buffer.byteLength(body);
            }
            headers['Content-type'] = contentType || 'application/json';
            break;
        case 'DELETE':
            headers['Content-length'] = 0;
            break;
        default:
            throw new Error('Unknown method, "' + method + '"');
    }

    var options = {
        hostname: this._api_host,
        port: this._api_port,
        headers: headers,
        path: path,
        method: method
    };

    var req = this._api_protocol.request(options, function (res) {
        if (!callback) {
            return;
        }

        var json = '';
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            json += chunk;
        });

        res.on('end', function () {
            var data;
            try {
                data = JSON.parse(json);
                if ( data.code || data.error ) {
                    throw (data);
                }
                callback(null, data);
            }
            catch (err) {
                callback(err);
            }
        });

        res.on('close', function (err) {
            callback(err);
        });
    });

	req.setTimeout(5000, function () {
	    req.connection.destroy();
	});

    body && req.write(body, contentType ? 'binary' : 'utf8');
    req.end();

    req.on('error', function (err) {
        callback && callback(err);
    });
}

function toDeleteOps(className, objects){
    return objects.map(function(object){
        return {
            method: 'DELETE',
            path: this._api_version + '/' + ( className === '_User' ? 'users/' : 'classes/' + className + '/' ) + object.objectId
        };
    });
}

function qsStringify(str) {
    var oldEscape = qs.escape;
    qs.escape = function(q){ return q; };
    var stringified = qs.stringify(str);
    qs.escape = oldEscape;
    return stringified;
}
