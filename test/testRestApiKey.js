// this file runs tests against the rest api key
var Parse = require('../index').Parse;

// use environment variables APPLICATION_ID and MASTER_KEY to test against
var application_id = process.env.APPLICATION_ID;
var rest_api_key = process.env.REST_API_KEY;

// require the environment variables, or exit with explanation
if (!application_id || !rest_api_key) {
  console.log('Set the following environment variables for the test Parse app');
  console.log('  export APPLICATION_ID=...');
  console.log('  export REST_API_KEY=...');
  process.exit(1);
}

// global objects to test against
var parse = new Parse({app_id: application_id, api_key: rest_api_key});
var user = {username: 'foo', password: 'bar'};
var user2 = {username: 'baz', password: 'qux'};
var userObject;
var user2Object;

exports.userLogin = function (test) {
  test.expect(4);
  parse.insertUser(user2, function (error, response) {
    test.ok(!error, 'Failed creating user.');
    user2Object = response;
    parse.insertUser(user, function (error, response) {
      test.ok(!error, 'Failed creating user.');
      userObject = response;
      parse.loginUser(user.username, user.password, function (error, response) {
        test.ok(!error, 'Login failed.');
        test.equal(user.username, response.username, 'Should be the same username.');
        test.done();
      });
    });
  });
};

exports.editUser = function (test) {
  test.expect(3);
  parse.updateUser(userObject.objectId, {username: 'foo0'}, userObject.sessionToken, function (error, response) {
    userObject.username = 'foo0';
    test.ok(!error);
    parse.getUser({objectId: userObject.objectId}, function (error, response) {
      test.ok(!error);
      test.equal(userObject.username, response.username, 'usernames should be the same.');
      test.done();
    });
  });
};

exports.editUserFail = function (test) {
  test.expect(1);
  parse.updateUser(user2Object.objectId, {username: 'baz0'}, userObject.sessionToken, function (error, response) {
    test.ok(error);
    test.done();
  });
};

exports.me = function (test) {
  test.expect(1);
  parse.me(userObject.sessionToken, function (error, response) {
    test.ok(!error);
    test.done();
  });
};

exports.deleteUser = function (test) {
  test.expect(2);
  parse.deleteUser(userObject.objectId, userObject.sessionToken, function (error, response) {
    test.ok(!error);
    parse.deleteUser(user2Object.objectId, user2Object.sessionToken, function (error, response) {
      test.ok(!error);
      test.done();
    });
  });
};
