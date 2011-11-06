Node Parse API
==============

install
-------

    npm install parse-api

examples
--------

    var Parse = require('parse-api').Parse;
    
    var APP_ID = ...;
    var MASTER_KEY = ...;
    
    var app = new Parse(APP_ID, MASTER_KEY);
    
    // add a Foo object, { foo: 'bar' }
    app.insert('Foo', { foo: 'bar' }, function (err, response) {
      console.log(response);
    });
    
    // the Foo with id = 'someId'
    app.find('Foo', 'someId', function (err, response) {
      console.log(response);
    });
    
    // all Foo objects with foo = 'bar'
    app.find('Foo', { foo: 'bar' }, function (err, response) {
      console.log(response);
    });
    
    app.update('Foo', 'someId', { foo: 'fubar' }, function (err, response) {
      console.log(response);
    });
    
    app.delete('Foo', 'someId', function (err) {
      // nothing to see here
    });
