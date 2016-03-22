var amqp    = require('amqplib/callback_api'),
    helper  = require('../helpers'),
    consts  = require('../helpers/constants'),
    config  = require('../config');

/*
 * Method to connect to the rabitMQ server. Single connection in the poll of connections
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
module.exports.send = function(msg, send) {
  // add trace if not present
  msg.trace     = msg.trace ? msg.trace : config.app.defaults.trace;
  // Set timestamp:
  msg.timestamp = {received : new Date().getTime()};
  // Set message status:
  msg.status    = consts.MSG_RECIVED;

  // Finally, lets send the message:
  var sms = JSON.stringify(msg);
  if(send)
    rabbitChannel.sendToQueue('messages', new Buffer(sms), {expiration: (msg.ttd*1000)});
  rabbitChannel.sendToQueue('log', new Buffer(sms), {priority: 8});

  console.log('Sent[*]', msg);
}

/*
 * Send a status update message to RabbitMQ server
 * @method send
 * @param {} state
 * @return
 */
module.exports.update = function(state) {
    rabbitChannel.sendToQueue('log', new Buffer(JSON.stringify(state)), {priority: 3});
    console.log('Sent[*]',state);
}