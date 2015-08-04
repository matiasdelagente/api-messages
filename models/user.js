var bcrypt = require('bcrypt');
var crypto = require('crypto');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var util = require('util');

function ValidationError(message, path) {
  this.code = 400;
  this.message = message;
  this.errors = {};
  this.errors[path] = {
    message: message,
    name: 'ValidatorError',
    path: path,
    type: 'user defined'
  };

  Error.call(this);
}

util.inherits(ValidationError, Error);

var OAuthUsersSchema = new Schema({
  email: { type: String, unique: true, required: true },
  hashed_password: { type: String, required: true },
  firstname: String,
  lastname: String
});

function hashPassword(password) {
  var salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

OAuthUsersSchema.static('register', function(fields, cb) {
  var user;

  fields.hashed_password = hashPassword(fields.password);
  delete fields.password;

  user = new OAuthUsersModel(fields);
  user.save(cb);
});

OAuthUsersSchema.static('getUser', function(email, password, cb) {
  OAuthUsersModel.authenticate(email, password, function(err, user) {
    if (err || !user) return cb(err);
    cb(null, user.email);
  });
});

OAuthUsersSchema.static('authenticate', function(email, password, cb) {
  this.findOne({ email: email }, function(err, user) {
    if (err || !user) return cb(err);
    cb(null, bcrypt.compareSync(password, user.hashed_password) ? user : null);
  });
});

mongoose.model('users', OAuthUsersSchema);

var OAuthUsersModel = mongoose.model('users');
module.exports = OAuthUsersModel;
