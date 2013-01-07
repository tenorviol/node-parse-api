var qs = require('querystring');

module.exports = Parse;

function Parse(application_id, master_key) {
  this._application_id = application_id;
  this._master_key = master_key;
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
  insertFile: function(fileName, data, contentType, callback) {
    parseRequest.call(this, 'POST', '/1/files/' + fileName, data, callback, contentType);
  },

  // get objects from class store
  find: function (className, query, callback) {
    if (typeof query === 'string') {

      // adding special case for Parse's User class
      if(className !== 'User' && className !== 'users') {
        parseRequest.call(this, 'GET', '/1/classes/' + className + '/' + query, null, callback);
      } else {
        parseRequest.call(this, 'GET', '/1/users/' + query, null, callback);
      }

    } else {

      // adding special case for Parse's User class
      if(className !== 'User' && className !== 'users') {
        parseRequest.call(this, 'GET', '/1/classes/' + className, { where: JSON.stringify(query) }, callback);
      } else {
        parseRequest.call(this, 'GET', '/1/users/', { where: JSON.stringify(query) }, callback);
      }
      
    }
  },

  // update an object in the class store
  update: function (className, objectId, object, callback) {
    parseRequest.call(this, 'PUT', '/1/classes/' + className + '/' + objectId, object, callback);
  },

  // update a single user - supports queries or objectId. Safely provides error where queries have more than one result instead of updating all.
  updateUser: function (userQuery, object, callback) {
    var objectId = null;
    var that = this;

    // check if a query was passed in instead of objectId
    if(typeof userQuery === 'string') {
      
      // user objectId was passed
      objectId = userQuery;
      parseRequest.call(that, 'PUT', '/1/users/' + objectId, object, callback);

    } else {
      
      // get the user objectId 
      this.find('User', userQuery, function(err, response) {

        if(err === null) {
          
          // response will be {"results":[]} if there is an error
          if(response.results.length === 1) {

            // just get the first result, assuming 
            objectId = response.results[0].objectId;
            console.dir(objectId);
            parseRequest.call(that, 'PUT', '/1/users/' + objectId, object, callback);

          } else if(response.results.length > 1) {
            return callback({ status: "error", message: 'There was more than one result for your query, so an update was deemed too dangerous to perform.'}, response);
          } else {
            return callback({ status: "error", message: 'There were no results for your query.'}, response);
          };

        } else {

          // there was an error finding the User
          return callback(err, response);
        };

      });
    };
  },

  // remove an object from the class store
  'delete': function (className, objectId, callback) {
    parseRequest.call(this, 'DELETE', '/1/classes/' + className + '/' + objectId, null, callback);
  }
};

// Parse.com https api request
function parseRequest(method, path, data, callback, contentType) {
  var auth = 'Basic ' + new Buffer(this._application_id + ':' + this._master_key).toString('base64');
  var headers = {
    Authorization: auth,
    Connection: 'Keep-alive'
  };

  var body = null;

  switch (method) {
    case 'GET':
      if (data) {
        path += '?' + qs.stringify(data);
      }
      break;
    case 'POST':
    case 'PUT':
      body = typeof data === 'object' ? JSON.stringify(data) : data;
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

    if (res.statusCode < 200 || res.statusCode >= 300) {
      var err = new Error('HTTP error ' + res.statusCode);
      err.arguments = arguments;
      err.type = res.statusCode;
      err.options = options;
      err.body = body;
      return callback(err);
    }

    var json = '';
    res.setEncoding('utf8');

    res.on('data', function (chunk) {
      json += chunk;
    });

    res.on('end', function () {
      var err = null;
      var data = null;
      try {
        var data = JSON.parse(json);
      } catch (err) {
        // pass to callback
      }
      callback(err, data);
      console.dir('sent data to callback');
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
