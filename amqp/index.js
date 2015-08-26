amqp    	= require('amqplib/callback_api');
var helper 	= require('../helpers');

/*
 * Method to connect to the rabitMQ server. Single connection on the poll of connections
 * @method connect
 * @param {} server (nameserv or ip)
 * @return 
 */
module.exports.connect= function(server) {
		amqp.connect('amqp://'+server.user+':'+server.pass+'@'+server.addr,function(err,conn) {
			  if (err !== null) return log.error(err);

			   conn.createChannel(function(err,ch) {
			   		if (err !== null) return log.error(err);
			   		rabbitChannel = ch;
			    	ch.assertQueue(server.queues.log,{ 'durable': true ,'maxPriority': 10},function(err,ok){console.log(ok)});
			    	ch.assertQueue(server.queues.msg,{ "durable": true, "deadLetterExchange": "dlx"},function(err,ok){console.log(ok)}); 
			  });
			});
}

/*
 * Send a message to RabbitMQ server - Makes the field name mapping
 * @method send
 * @param {} msg
 * @return 
 */
module.exports.send = function(msg) {
	//Agregamos trace:
	msg.trace 		= config.app.defaults.trace;
	//Seteamos timestamp:
	msg.timestamp	= {received : new Date().getTime()};
	//Seteamos el estado:
	msg.status		= 0;
	
	//Finalmente enviamos el mensaje:
		var sms = JSON.stringify(msg);
		rabbitChannel.sendToQueue('messages', new Buffer(sms), {expires: msg.ttd});
		rabbitChannel.sendToQueue('log', new Buffer(sms), {priority: 8});

		console.log('Sent[*]',sms);
}

/*
 * Send a status update to RabbitMQ server - Makes the field name mapping
 * @method send
 * @param {} msg
 * @return 
 */
module.exports.update = function(state) {
		rabbitChannel.sendToQueue('log', new Buffer(JSON.stringify(state)), {priority: 3});
		console.log('Sent[*]',state);
}