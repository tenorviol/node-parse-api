Node Parse API
==============

IMPORTANT NOTE: This api is not currently maintained.
If I were starting a parse project today using node.js,
I would probably start out with https://github.com/shiki/kaiseki

install
-------

    npm install parse-api

examples
--------

### setup

    var Parse = require('parse-api').Parse;

    var APP_ID = ...;
    var MASTER_KEY = ...;

    var app = new Parse(APP_ID, MASTER_KEY);

### insert

    // add a Foo object, { foo: 'bar' }
    app.insert('Foo', { foo: 'bar' }, function (err, response) {
      console.log(response);
    });

### insert file
	var fs = require('fs'),
		fileName = 'myMedia.mp3';
	fs.readFile(fileName, function (err, data) {
		if (err) throw err;
		app.insertFile(fileName, data, 'audio/mpeg', function(err, response){
			if(err) throw err;
			console.log('Name: ' + response.name);
			console.log('Url: ' + response.url);
		});
	});


### find one

    // the Foo with id = 'someId'
    app.find('Foo', 'someId', function (err, response) {
      console.log(response);
    });

### find many

    // all Foo objects with foo = 'bar'
    app.find('Foo', { foo: 'bar' }, function (err, response) {
      console.log(response);
    });

### update

    app.update('Foo', 'someId', { foo: 'fubar' }, function (err, response) {
      console.log(response);
    });

### delete

    app.delete('Foo', 'someId', function (err) {
      // nothing to see here
    });
