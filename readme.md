Node Parse API
==============

install
-------

```
npm install node-parse-api
```

examples
--------

### setup with MASTER_KEY

```javascript
var Parse = require('node-parse-api').Parse;

var APP_ID = ...;
var MASTER_KEY = ...;

var app = new Parse(APP_ID, MASTER_KEY);
```

### setup with API_KEY

```javascript
var Parse = require('node-parse-api').Parse;

var options = {
    app_id:'...',
    api_key:'...' // master_key:'...' could be used too
}

var app = new Parse(options);
```

### insert an object

* insert(className `string`, data `object`, callback `function`)

```javascript
// add a Foo object, { foo: 'bar' }
app.insert('Foo', { foo: 'bar' }, function (err, response) {
  console.log(response);
});
```

### insert a User

* insertUser(data `object`, callback `function`)

```javascript
app.insertUser({
  username: 'foo',
  password: 'bar'
}, function (err, response) {
  console.log(response);
});
```

More properties can be provided, but username and password are required.

### insert a User with a Pointer

```javascript
app.insertUser({
  username: 'foo',
  password: 'bar',
  pointer/*can have any name*/: {
    __type: 'Pointer',
    className: <string>,
    objectId: <string>
    }
  }, function (err, response) {
  console.log(response);
});
```

### insert a User with GeoPoints

```javascript
app.insertUser({
  username: 'foo',
  password: 'bar',
  location: {
    __type: 'GeoPoint',
    latitude: <int>,
    longitude: <int>
    }
  }, function (err, response) {
  console.log(response);
});
```

### user login

* loginUser(username `string`, password `string`, callback `function`)

Response contains all of the user fields except password, also includes a sessionToken for this user.

```javascript
app.loginUser('foo', 'bar', function (error, response) {
  // response = {sessionToken: '', createdAt: '', ... }
  });
```

### me

* me(sessionToken `string`, callback `function`)

```javascript
app.me('sessionToken', function (error, response) {
  // response is same as getUser response
});
```

### insert a file

*  insertFile(fileName `string`, data `string/buffer`, contentType `string`, callback `function`)

```javascript
// first upload the file to the parse cloud
app.insertFile('foo.txt', 'bar', 'text/plain', function (err, response) {
  // then insert a new object with the link to the new file
  app.insert('MyFile', {__type: 'File', "name": response.name }, function (error, response) {
  });
});
```

### find one

* find(className `string`, query `object`, callback `function`)

```javascript
// the Foo with id = 'someId'
app.find('Foo', {objectId: 'someId'}, function (err, response) {
  console.log(response);
});
```

Returned fields can be restricted with the 'keys' query.

```javascript
var query = {
  objectId: 'someId',
  keys: 'foo,bar'
};
app.find('Foo', query, function (error, response) {
  //response object will only contain foo and bar fields, as well as the special built-in fields (objectId, createdAt and updatedAt)
  });
```

### find many

* find(className `string`, query `object`, callback `function`)

```javascript
// all Foo objects with foo = 'bar'
app.find('Foo', {where: {foo: 'bar'}}, function (err, response) {
  console.log(response);
});

// all Foo objects
// '', null, undefined or any other falsy value will work
app.find('Foo', '', function (err, response) {
  console.log(response);
}):
```

All types of query constraints Parse provides can be added to the query object as properties. (order, limit, keys, count, include...)

```javascript
var query = {
  where: {
    foo: 'bar',
    baz: 'qux'
  },
  limit: 10,
  skip: 5,
  order: '-createdAt'
};
app.find('Foo', query, function (error, response ) {
  // the first 5 results will be ignored and the next 10 results will be returned
  // response.results will contain up to 10 objects with foo = 'bar' and baz = 'qux', sorted from latest to oldest
  });
```

### find one user

* getUser(query `object`, callback `function`)

```javascript
app.find({objectId: 'someId'}, function (err, response) {
  console.log(response);
});
```

### find many users

* getUser(query `object`, callback `function`)

```javascript
// all users with foo = 'bar'
app.find({where: {foo: 'bar'}}, function (err, response) {
  console.log(response);
});

// all users
// '', null, undefined or any other falsy value will work
app.find('', function (err, response) {
  console.log(response);
}):
```

### count the number of objects

```javascript

var query = {
  count: 1,
  limit: 0
};
app.find('Foo', query, function (error, response) {
  // {
  //   results: [],
  //   count: 123
  // }
});
```

### edit an object

* update(className `string`, objectId `string`, callback `function`)

```javascript
app.update('Foo', 'someId', {foo: 'bar'}, function (err, response) {
  console.log(response);
});
```

### delete an object

* delete(className `string`, objectId `string`, callback `function`)

```javascript
app.delete('Foo', 'someId', function (err, response) {
  // response = {}
});
```

### delete all objects in a class

* deleteAll(className `string`, callback `function`)

```javascript
app.deleteAll('Foo', function (err, response) {
  // response = [{success: {}, success: {}, ... }]
});
```

### delete user

* deleteUser(objectId `string`, [sessionToken `string`], callback `function`)

If you are using the master key you don't need any session tokens.

```javascript
app.deleteUser('someId', function (err, response) {
  // response = {}
});
```

If you're using the rest api key you will need a session token and will only be able to delete the user object of the matching user.

```javascript
app.deleteUser('someId', 'sessionToken', function (error, response) {
  // response = {}
});
```

### delete all users

* deleteAllUsers(callback `function`)

This will only work when using the master key.

```javascript
app.deleteAllUsers(function (err, response) {
  // response = [{success: {}, success: {}, ... }]
});
```

### reset a password

* passwordReset(data `string`, callback `function`)

```javascript
//email is built into Parse's special User class
app.passwordReset(email, function(err, response){
  console.log(response);
});
```

### edit a user object

* updateUser(objectId `string`, data `object`, [sessionToken `string`], callback `function`)

With master key

```javascript
app.updateUser('someId', {email: 'foo@example.com'}, function(err, response){
  console.log(response);
});
```

or with rest api key

```javascript
app.updateUser('someId', {email: 'foo@example.com'}, 'sesstionToken', function(err, response){
  console.log(response);
});
```

### batch requests

* batch(requests `array`, callback `function`)

```javascript
var requests = [
  {
    method: 'POST',
    path: '/1/classes/Foo',
    body: {
      foo: 'bar1',
      baz: 'qux1'
    }
  },
  {
    method: 'POST',
    path: '/1/classes/Foo',
    body: {
      foo: 'bar2',
      baz: 'qux2'
    }
  }
];
app.batch(requests, function (error, response) {
  // response = [{success: {createdAt: '', objectId: ''}, {success: {...}}}]
});
```

### insert installation data

```javascript
//first arg is either 'ios' or 'android'.  second arg is either the Apple deviceToken or the Android installationId.
app.insertInstallationData("ios", "0123456784abcdef0123456789abcdef0123456789abcdef0123456789abcdef", function(err, response){
  if (err) {
    console.log(err);
  } else {
    console.log(response);
  }
});
```

### insert installation data with timeZone

```javascript
//first arg is either 'ios' or 'android'.  second arg is either the Apple deviceToken or the Android installationId.  Third arg is the timezone string.
app.insertInstallationDataWithTimeZone("ios", "0123456784abcdef0123456789abcdef0123456789abcdef0123456789abcdef", "EST", function(err, response){
  if (err) {
    console.log(err);
  } else {
    console.log(response);
  }
});
```

### insert installation data with channels

```javascript
//first arg is either 'ios' or 'android'.  second arg is either the Apple deviceToken or the Android installationId.  Third arg is the channels array.
arr = ["news", "sports"];
app.insertInstallationDataWithChannels("ios", "0123456784abcdef0123456789abcdef0123456789abcdef0123456789abcdef", arr, function(err, response){
  if (err) {
    console.log(err);
  } else {
    console.log(response);
  }
});
```

### insert installation data with timeZone and channels

```javascript
//first arg is either 'ios' or 'android'.  second arg is either the Apple deviceToken or the Android installationId.  Third arg is the timezone string.  4th is the channels array.
arr = ["news", "sports"];
app.insertInstallationDataWithTimeZoneAndChannels("ios", "0123456784abcdef0123456789abcdef0123456789abcdef0123456789abcdef", "EST", arr, function(err, response){
  if (err) {
    console.log(err);
  } else {
    console.log(response);
  }
});
```

### create a role for a particular user

```javascript
//create a data object that links the user object's objectId to the role

var data = {
  name: 'Administrator',
  ACL: {
      "*": {
        "read": true
      }
    },
  roles: {
      "__op": "AddRelation",
      "objects": [
        {
          "__type": "Pointer",
          "className": "_Role",
         "objectId": "<objectId>"
        }
      ]
    },
  users: {
      "__op": "AddRelation",
      "objects": [
        {
          "__type": "Pointer",
          "className": "_User",
          "objectId": "<objectId>"
        }
      ]
    }
};

  app.insertRole(data, function(err, resp){
     console.log(resp);
   });
```

### get a role

```javascript
//pass the role object's objectId
app.getRole("<objectId>", function(err, resp){
  console.log(resp);
});
```

### update a role

```javascript
//pass the objectId of the role, data contains the user's objectId

var data = {
  users: {
      "__op": "RemoveRelation",
      "objects": [
        {
          "__type": "Pointer",
          "className": "_User",
          "objectId": "<objectId>"
        }
      ]
    }
};

  app.updateRole("<objectId>", data, function(err, resp){
    console.log(resp);
  });
```

### delete a role

```javascript
//pass the objectId of the role
app.deleteRole("<objectId>", function(err, resp){});
```

### get all the roles

```javascript
app.getRoles(function(err, resp){});
```

### get a role against a cetain param

```javascript
var params = {
   where: { name: "Administrator" }
};

   app.getRoles(params, function(err, resp){
     console.log(resp);
   });
```

### send a push notification

```javascript
//The data param has to follow the data structure as described in the [Parse REST API](https://www.parse.com/docs/rest#push)
var notification = {
  channels: [''],
  data: {
    alert: "sending too many push notifications is obnoxious"
  }
};
app.sendPush(notification, function(err, resp){
  console.log(resp);
});
```

### note on sending dates

```javascript
//when inserting a data, you must use the Parse date object structure, i.e.:
{
  "__type": "Date",
  "iso": new Date("<year>", "<month>", "<day>").toJSON()
}
```

# License

node-parse-api is available under the MIT license.

Copyright © 2015 Mike Leveton and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
