var http	= require('http');
var config  = require('./config');

//RabbitMQ library:
require('./amqp').connect((config.amqp));

//Oauth2:
require('./oauth2').initialize();

//Loging setup:
var Log 	= require('log')
    log 	= new Log();
    colors 	= require('colors');

//Express:
var express     = require('express');
var bodyParser 	= require('body-parser');

var app 		= express();
	router 		= express.Router();

//Request parsing middlewares:
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Application router:
require('./router');
app.use('/v'+config.app.ver ,router);

app.use(function(err, req, res, next) {
  if(err.status == 400)
  	res.status(err.statusCode).send({type: 'Solicitud malformada' ,description: err.stack.split('\n')[0]});
});

http.createServer(app).listen(config.app.port, function(){
  log.info('apiMessages  puerto:', config.app.port);
});
