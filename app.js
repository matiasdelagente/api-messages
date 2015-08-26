//Loging setup:
var Log 	= require('log')
    log 	= new Log();
    colors 	= require('colors');

//Oauth2:
var oauth2 	= require('./oauth2').initialize();

//Express:
var express         = require('express');
var bodyParser      = require('body-parser');

app 	= express();
router 	= express.Router();

//Request parsing middlewares:
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Application router:
require('./router');
app.use('/api/'+config.app.ver ,router);

// Magic
module.exports = app;