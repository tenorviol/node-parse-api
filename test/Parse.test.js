// this file runs tests against the master key
var Parse = require('../index').Parse;

// use environment variables APPLICATION_ID and MASTER_KEY to test against
var application_id = process.env.APPLICATION_ID;
var master_key = process.env.MASTER_KEY;

// require the environment variables, or exit with explanation
if (!application_id || !master_key) {
  console.log('Set the following environment variables for the test Parse app');
  console.log('  export APPLICATION_ID=...');
  console.log('  export MASTER_KEY=...');
  process.exit(1);
}

// global objects to test against
var parse = new Parse(application_id, master_key);
var className = 'NodeParseApiTest';
var className2 = 'NodeParseApiRelationTest';
var stub1;
var stub2;
var stub3;
var stubRelation;

exports.insert = function (test) {
  var data = {
    foo: 'bar0',
    baz: 'qux0',
    quux: 'quuux'
  };
  parse.insert(className, data, function (error, response) {
    test.expect(1);
    test.ok(!error, 'There shoudn\'t be an error object.');
    stub1 = response;
    test.done();
  });
};

exports.batchInsert = function (test) {
  var batchRequests = [
    {
      method: 'POST',
      path: '/1/classes/' + className,
      body: {
        foo: 'bar1',
        baz: 'qux1',
        quux: 'quuux'
      }
    },
    {
      method: 'POST',
      path: '/1/classes/' + className,
      body: {
        foo: 'bar2',
        baz: 'qux2',
        quux: 'quuux'
      }
    }
  ];
  parse.batch(batchRequests, function (error, response) {
    test.expect(1);
    test.ok(!error, 'There shoudn\'t be an error object.');
    stub2 = response[0].success;
    stub3 = response[1].success;
    test.done();
  });
};

exports.find = function (test) {
  parse.find(className, stub1.objectId, function (err, response) {
    test.equal(stub1.objectId, response.objectId);
    test.done();
  });
};

exports.findManyNoConstraints = function (test) {
  parse.find(className, '', function (error, response) {
    test.expect(3);
    test.ok(!error, 'There shoudn\'t be an error object.');
    test.ok(response.results.length === 3, 'There should be 3 objects in response.results.');
    test.equal(stub1.objectId, response.results[0].objectId, 'The first object should have the same objectId as the stub object.');
    test.done();
  });
};

// order limit skip keys include
exports.findManyWithConstraints = {
  order: function (test) {
    var query = {
      order: '-foo'
    };
    parse.find(className, query, function (error, response) {
      test.expect(4);
      test.ok(!error, 'There shoudn\'t be an error object.');
      test.equal('bar0', response.results[2].foo, 'response.results[2].foo should be "bar0".');
      test.equal('bar1', response.results[1].foo, 'response.results[1].foo should be "bar1".');
      test.equal('bar2', response.results[0].foo, 'response.results[0].foo should be "bar2".');
      test.done();
    });
  },
  'order keys skip': function (test) {
    var query = {
      order: 'foo',
      keys: 'baz',
      skip: 2
    };
    parse.find(className, query, function (error, response) {
      test.ok(!error, 'There shoudn\'t be an error object.');
      test.equal('qux2', response.results[0].baz, 'response.results[0].baz should be "qux2".');
      test.done();
    });
  },
  'order limit': function (test) {
    var query = {
      order: '-foo',
      limit: 2
    };
    parse.find(className, query, function (error, response) {
      test.expect(4);
      test.ok(!error, 'There shoudn\'t be an error object.');
      test.ok(response.results.length === 2, 'There should be 2 objects in response.results.');
      test.equal('bar1', response.results[1].foo, 'response.results[1].foo should be "bar1".');
      test.equal('qux1', response.results[1].baz, 'response.results[1].baz should be "qux1".');
      test.done();
    });
  }
};

exports.deprecatedFindMany = {
  setUp: function (callback) {
    this.query = {
      quux: 'quuux'
    };
    callback();
  },
  '3 arguments': function (test) {
    parse.findMany(className, this.query, function (error, response) {
      test.expect(2);
      test.ok(!error, 'There shoudn\'t be an error object.');
      test.ok(response.results.length === 3, 'There should be 3 objects in response.results.');
      test.done();
    });
  },
  '5 arguments': function (test) {
    parse.findMany(className, this.query, 'foo', 2, function (error, response) {
      test.expect(3);
      test.ok(!error, 'There shoudn\'t be an error object.');
      test.ok(response.results.length === 2, 'There should be 2 objects in response.results.');
      test.equal('bar0', response.results[0].foo, 'response.results[0].foo should be "bar0".');
      test.done();
    });
  },
  '6 arguments': function (test) {
    parse.findMany(className, this.query, 'foo', 2, 1, function (error, response) {
      test.expect(3);
      test.ok(!error, 'There shoudn\'t be an error object.');
      test.ok(response.results.length === 2, 'There should be 2 objects in response.results.');
      test.equal('bar1', response.results[0].foo, 'response.results[0].foo should be "bar1".');
      test.done();
    });
  },
  'invalid number of arguments': function (test) {
    test.expect(1);
    test.throws(function () {parse.findMany('foo', 'bar', 'baz', 'qux');});
    test.done();
  }
};

exports.update = function (test) {
  stub1.foo = 'bar00';
  parse.update(className, stub1.objectId, {foo: 'bar00'}, function (error, response) {
    test.expect(4);
    test.ok(!error, 'There shoudn\'t be an error object.');
    test.ok(response);
    parse.find(className, stub1.objectId, function (error, response) {
      test.ok(!error, 'There shoudn\'t be an error object.');
      test.equal(stub1.foo, response.foo, 'response.foo should be "bar00".');
      test.done();
    });
  });
};

exports.insertClass2 = function (test) {
  parse.insert(className2, {foo: 'bar'}, function (error, response) {
    test.expect(1);
    test.ok(!error, 'There shoudn\'t be an error object.');
    stubRelation = response;
    test.done();
  });
};

exports.addRelation = function (test) {
  parse.addRelation("secondObject", className2, stubRelation.objectId, className, stub1.objectId, function (error, response) {
    test.expect(3);
    test.ok(!error, 'There shoudn\'t be an error object.');

    var query = {
      where: {
        $relatedTo: {
          object: {
            __type: 'Pointer',
            className: className2,
            objectId: stubRelation.objectId
          },
          key: 'secondObject'
        }
      }
    };
    parse.find(className, query, function (error, response) {
      test.ok(!error, 'There shoudn\'t be an error object.');
      test.equal(stub1.foo, response.results[0].foo, 'The response object should contain the related object.');
      test.done();
    });
  });
};

exports.deleteOne = function (test) {
  parse.delete(className2, stubRelation.objectId, function (error, response) {
    test.expect(3);
    test.ok(!error, 'There shouldn\'t be an error object.');
    parse.find(className2, stubRelation.objectId, function (error, response) {
      test.ok(error, 'There should be an error object.');
      test.equal(101, error.code, 'error.code should be 101.');
      test.done();
    });
  });
};

exports.deleteAll = function (test) {
  parse.deleteAll(className, function (error, response) {
    test.expect(2);
    test.ok(!error, 'There shoudn\'t be an error object.');
    test.ok(response[0].hasOwnProperty('success'));
    test.done();
  });
};

exports.installationTests = {
  upsertInstallation: function(test) {
    parse.upsertInstallation('ios', '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', {userID: 'jenny'}, function(error, response) {
      test.ok(!error, 'There shouldn\'t be an error object');
      test.done();
    });
  },

  deleteInstallation: function(test) {
    parse.getInstallationDataForDeviceToken('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', function(error, response) {
      var id = response.results[0].objectId;
      parse.deleteInstallation(id, function(error, response){
        test.ok(!error, 'There shouldn\'t be an error obejct');
        test.done();
      });
    });
  }
}

exports.userTests = {
  insertUser : function (test) {
    test.expect(1);
    parse.insertUser({username: 'foo', password: 'bar'}, function (error, response) {
      test.ok(!error, 'There shoudn\'t be an error object.');
      test.done();
    });
  },
  getUser: function (test) {
    test.expect(2);
    parse.getUser({where:{username: 'foo'}}, function (error, response) {
      test.ok(!error, 'There shoudn\'t be an error object.');
      test.equal('foo', response.results[0].username, 'response.results[0].username should be foo.');
      test.done();
    });
  },
  deleteUser: function (test) {
    test.expect(1);
    parse.getUser({where:{username: 'foo'}}, function (error, response) {
      parse.deleteUser(response.results[0].objectId, function (error, response) {
        test.ok(!error, 'There shoudn\'t be an error object.');
        test.done();
      });
    });
  }
};

exports.pushNotificationError = function (test) {
  parse.sendPush({
    channels: ['foobar'],
    data2: {
      alert: 'test message'
    }
  }, function (error, response) {
    test.expect(3);
    test.ok(error);
    test.equal(response, null);
    test.equal(error.code, 115, 'error.code should be 115.');
    test.done();
  });
};
