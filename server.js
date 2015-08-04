config   	= require('./config');

var app		= require('./app');
var http	= require('http');

//RabbitMQ library:
rabbit = require('./amqp').connect((config.amqp));

http.createServer(app).listen(config.app.port, function(){
  log.info('apiMessages  puerto:', config.app.port);
});
