/*
 * api-messages
 * Pogui @ tween (7/2015)
 * Matias P. Sassi (2/2016)
 */

//newRelic plugin:
var nodeEnv = process.env.NODE_ENV || 'development';
if(nodeEnv === "production")
{
  require('newrelic');
}

//mongoDB:
require('./db');

var http  = require('http');
var config  = require('./config');


// RabbitMQ library:
require('./amqp').connect((config.amqp));

// Oauth2:
require('./oauth2').initialize();

// Loging setup:
var Log   = require('log'),
    log   = new Log();
    colors  = require('colors');

//Express:
var express     = require('express');
var bodyParser  = require('body-parser');
var morgan      = require('morgan');

var app    = express(),
    router = express.Router();

//Custom morgan request logger format:
app.use(morgan(':remote-addr [:date[clf]] ":method :url HTTP/:http-version" :status :response-time ms'));

//Request parsing middlewares:
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Application router:
require('./router')(router);
app.use('/v'+config.app.ver + '/',router);

app.use(function(err, req, res, next) {
  if(err.status == 400)
    res.status(err.statusCode).send({type: 'Solicitud malformada' ,description: err.stack.split('\n')[0]});
});

http.createServer(app).listen(config.app.port, function(){
  log.info("Started apiMessages in " +  nodeEnv + " environment at port:", config.app.port);
});