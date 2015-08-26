config   	= require('./config');

var app		= require('./app');
var http	= require('http');

//RabbitMQ library:
rabbit = require('./amqp').connect((config.amqp));
oauth2 = require('./oauth2');

app.use(function(err, req, res, next) {
  if(err.status == 400)
  	res.status(err.statusCode).send({type: 'Solicitud malformada' ,description: err.stack.split('\n')[0]});
});

http.createServer(app).listen(config.app.port, function(){
  log.info('apiMessages  puerto:', config.app.port);
});