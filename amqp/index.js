var config          = require("../config"),
    amqpHelper      = require("../helpers/amqp"),
    consts          = require("../helpers/constants"),
    Log             = require("log"),
    log             = new Log(),
    amqpChannels    = {};


/*
 * Method to connect to the rabitMQ server.
 * @method connect
 * @param {} server (nameserv or ip)
 * @return
 */
module.exports.connect = function(amqpConfig)
{
  // we need to pass a reference to amqpChannels so we can use it in other methods
  // it will get populated with the channels references
  amqpHelper.initializeAMQP(amqpConfig, amqpChannels);
};

/*
 * Send a message to RabbitMQ server - Makes the field name mapping
 * @method send
 * @param {} msg
 * @return
 */
module.exports.send = function(msg, send)
{
  // add trace if not present
  msg.trace     = msg.trace ? msg.trace : config.app.defaults.trace;
  // Set timestamp:
  msg.timestamp = {received : new Date().getTime()};
  // Set message status:
  msg.status    = consts.MSG_RECIVED;

  // Finally, lets send the message:
  var sms = JSON.stringify(msg);
  if(send)
    amqpChannels.messages.channel.publish("delayedMessages", "", new Buffer(sms), {headers: {"x-delay": msg.ttd*1000}});

  // always log
  amqpChannels.messages.channel.sendToQueue("log", new Buffer(sms), {priority: 8});

  log.info("Sent save[*]", msg);
};

/*
 * Send a status update message to RabbitMQ server
 * @method send
 * @param {} state
 * @return
 */
module.exports.update = function(state)
{
  amqpChannels.messages.channel.sendToQueue("log", new Buffer(JSON.stringify(state)), {priority: 3});
  log.info("Sent update[*]", state);
};


module.exports.sendToCallbackExchange = function(dlr, routingKey)
{
  var dlrJSON = JSON.stringify(dlr);
  log.info("Sending DLR to apiDLR exchange with routing key: " + routingKey + " and message: " + dlrJSON);
  amqpChannels.dlr.channel.publish("apiDlr", routingKey, new Buffer(dlrJSON));
};
