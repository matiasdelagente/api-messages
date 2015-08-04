//Loging setup:
var Log = require('log')
    log = new Log();
    colors = require('colors');

//Express:
var express         = require('express');
var bodyParser      = require('body-parser');

app = express();
router = express.Router();

var path        = require('path');
var models      = require('./models');
var oauthserver = require('node-oauth2-server');
var User        = models.User;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.oauth = oauthserver({
  model: models.oauth,
  grants: ['password', 'authorization_code', 'refresh_token'],
  debug: true
});

require('./router');
app.use('/api/'+config.app.ver ,router);

// Magic
module.exports = app;