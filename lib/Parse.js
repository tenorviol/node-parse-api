var qs = require('querystring');

qs.escape = function(q){ return q; };

module.exports = Parse;

function Parse(options_or_application_id, master_key) {
    this._options = {};
    if (master_key) {
        this._options.app_id = options_or_application_id;
        this._options.master_key = master_key;
    } else {
        this._options = options_or_application_id;
    }
}

Parse.prototype = {
    _api_protocol: require('https'),
    _api_host: 'api.parse.com',
    _api_port: 443,

    // add object to class store
    insert: function (className, object, callback) {
        parseRequest.call(this, 'POST', '/1/classes/' + className, object, callback);
    },

    // add files
    insertFile: function(fileName, data, contentType, callback){
        parseRequest.call(this, 'POST', '/1/files/' + fileName, data, callback, contentType);
    },

    // create a new user
    insertUser: function (data, callback) {
        parseRequest.call(this, 'POST', '/1/users/', data, callback);
    },

    // get an object from the class store
    find: function (className, query, callback) {
        var url = '/1/' + (className === '_User' ? 'users' : 'classes/' + className);
        var queryType = typeof query;
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
                url += '?where=' + JSON.stringify(query.where);
                delete query.where;
            }

            // if there are no more constraints left in the query object 'remainingQuery' will be an empty string
            var remainingQuery = qs.stringify(query);
            if ( remainingQuery ) {
                url += ( url.indexOf('?') === -1 ? '?' : '&' ) + remainingQuery;
            }

        }
        parseRequest.call(this, 'GET', url, null, callback);
    },

    // get a collection of objects
    findMany: function (className, query, order, limit, skip, callback) {
        console.warn('"findMany" is deprecated, please use "find" instead.');

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
            default: throw new Error('Unexpected number of arguments');
        }

        this.find(className, query, callback);
    },

    // do a batch of requests at once
    batch: function (requests,callback) {
        parseRequest.call(this,'POST','/1/batch',{requests:requests},callback);
    },

    // user login
    loginUser: function (username, password, callback) {
        parseRequest.call(this, 'GET', '/1/login/?username=' + username + '&password=' + password, null, callback);
    },

    // retrieve contents of one or more user objects
    getUser: function (query, callback, deprecatedCallback) {
        if ( arguments.length === 3 ) {
            console.warn('Logging in with "getUser" is deprecated, please use loginUser instead.');
            console.warn('Use "getUser" to retrieve one or more user object contents without logging in.');
            this.loginUser(query, callback, deprecatedCallback);
        } else {
            this.find('_User', query, callback);
        }
    },

    // get an object belonging to a certain User
    getFileByUser: function(userId, className, callback) {
        queryString = 'where={"user":' + '"' + userId + '"' + '}';
        encodedString = encodeURIComponent(queryString);
        parseRequest.call(this, 'GET', '/1/classes/' + className + '?' + encodedString, null, callback);
    },

    // insert an object into Parse
    insertCustom: function (className, object, callback) {
        parseRequest.call(this, 'POST', '/1/' + className, object, callback);
    },

    // update an object in the class store
    update: function (className, objectId, object, callback) {
        parseRequest.call(this, 'PUT', '/1/classes/' + className + '/' + objectId, object, callback);
    },

    // update a User object's email address
    updateUserEmail: function(objectId, data, callback) {
        data = { email: data };
        parseRequest.call(this, 'PUT', '/1/users/' + objectId, data, callback);
    },

    // update a User object's username*
    updateUserName: function(objectId, data, callback) {
        data = { username: data };
        parseRequest.call(this, 'PUT', '/1/users/' + objectId, data, callback);
    },

    // update any keys of a User object
    updateUser: function (objectId, data, callback) {
        parseRequest.call(this, 'PUT', '/1/users/' + objectId, data, callback);
    },

    // reset a User object's password
    passwordReset: function (data, callback) {
        data = { email: data };
        parseRequest.call(this, 'POST', '/1/requestPasswordReset/', data, callback);
    },

    // remove an object from the class store
    delete: function (className, objectId, callback) {
        parseRequest.call(this, 'DELETE', '/1/classes/' + className + '/' + objectId, null, callback);
    },

    // upload installation data
    insertInstallationData: function (deviceType, deviceToken, callback) {
        if (deviceType === 'ios'){
            data = { deviceType: deviceType, deviceToken: deviceToken };
        }
        else {
            data = { deviceType: deviceType, installationId: deviceToken };
        }
        parseRequest.call(this, 'POST', '/1/installations/', data, callback);
    },

    insertInstallationDataWithTimeZone: function (deviceType, deviceToken, timeZone, callback) {
        if (deviceType === 'ios'){
            data = { deviceType: deviceType, deviceToken: deviceToken, timeZone: timeZone };
        }
        else {
            data = { deviceType: deviceType, installationId: deviceToken, timeZone: timeZone };
        }
        parseRequest.call(this, 'POST', '/1/installations/', data, callback);
    },

    insertInstallationDataWithChannels: function (deviceType, deviceToken, channels, callback) {
        if (deviceType === 'ios'){
            data = { deviceType: deviceType, deviceToken: deviceToken, channels: channels };
        }
        else {
            data = { deviceType: deviceType, installationId: deviceToken, channels: channels };
        }
        parseRequest.call(this, 'POST', '/1/installations/', data, callback);
    },

    insertInstallationDataWithTimeZoneAndChannels: function (deviceType, deviceToken, timeZone, channels, callback) {
        if (deviceType === 'ios'){
            data = { deviceType: deviceType, deviceToken: deviceToken, timeZone: timeZone, channels: channels };
        }
        else {
            data = { deviceType: deviceType, installationId: deviceToken, timeZone: timeZone, channels: channels };
        }
        parseRequest.call(this, 'POST', '/1/installations/', data, callback);
    },

    updateInstallationDataChannels: function(objectId, channels, callback) {
        parseRequest.call(this, 'PUT', '/1/installations/' + objectId, {
            channels: channels
        }, callback);
    },

    getInstallationData: function(callback) {
        parseRequest.call(this, 'GET', '/1/installations', null, callback);
    },

    getInstallationDataForDeviceToken: function(deviceToken, callback) {
        parseRequest.call(this, 'GET', '/1/installations?where={"deviceToken":"'+deviceToken+'"}', null, callback);
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
            parseRequest.call(this, 'GET', '/1/classes/' + className, null, query);
        }
        if (typeof(query) === "string") {
            parseRequest.call(this, 'GET', '/1/classes/' + className + '/' + query, null, callback);
        } else {
            parseRequest.call(this, 'GET', '/1/classes/' + className, { where: JSON.stringify(query) }, callback);
        }
    },

    addRelation: function( relationName, className1, objectId1, className2, objectId2, callback) {
        data = {};
        data[relationName] = { __op:"AddRelation",objects:[{__type:"Pointer",className:className2,objectId:objectId2}]};
        parseRequest.call(this,'PUT','/1/classes/' + className1+'/'+objectId1,data,callback);
    },

    removeRelation: function( relationName, className1, objectId1, className2, objectId2, callback) {
        data = {};
        data[relationName] = { __op:"RemoveRelation",objects:[{__type:"Pointer",className:className2,objectId:objectId2}]};
        parseRequest.call(this,'PUT','/1/classes/' + className1+'/'+objectId1,data,callback);
    },


    insertRole: function (data, callback) {
        parseRequest.call(this, 'POST', '/1/roles/', data, callback);
    },

    getRole: function (objectId, callback) {
        parseRequest.call(this, 'GET', '/1/roles/' + objectId, null, callback);
    },

    getRoles: function (params, callback) {
        if (typeof(params) === "function") {
            parseRequest.call(this, 'GET', '/1/roles/', null, params);
        }
        if (typeof(params) === "string") {
            parseRequest.call(this, 'GET', '/1/roles/' + params, null, callback);
        } else {
            params = JSON.stringify(params);
            parseRequest.call(this, 'GET', '/1/roles/', params, callback);
        }
    },

    updateRole: function (objectId, data, callback) {
        parseRequest.call(this, 'PUT', '/1/roles/' + objectId, data, callback);
    },

    deleteRole: function (objectId, callback) {
        parseRequest.call(this, 'DELETE', '/1/roles/' + objectId, callback);
    },

    sendPush: function (data, callback) {
        parseRequest.call(this, 'POST', '/1/push/', data, callback);
    },

    deleteAll: function(modelName, callback){
        var that = this;
        this.findMany(modelName, '', function(err, response){
            var requests = toDeleteOps(modelName, response.results);
            that.batch(requests, callback);
        });
    }
};

// Parse.com https api request
function parseRequest(method, path, data, callback, contentType) {
    var headers = {
        Connection: 'Keep-alive'
    };

    if(this._options.master_key){
        var auth = 'Basic ' + new Buffer(this._options.app_id + ':' + this._options.master_key).toString('base64');
        headers.Authorization = auth;
    }else if(this._options.api_key){
        headers['X-Parse-Application-Id'] = this._options.app_id;
        headers['X-Parse-REST-API-Key'] = this._options.api_key;
    }


    var body = null;

    switch (method) {
        case 'GET':
            if (data) {
                path += (path.indexOf("?") == -1 ? '?' : '&') + qs.stringify(data);
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
        host: this._api_host,
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
                if ( data.code ) {
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
            path: '/1/classes/' + className + '/' + object.objectId,
            body: {}
        };
    });
}
