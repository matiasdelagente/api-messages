var amqp        = require("amqplib/callback_api"),
    helper      = require("../helpers"),
    amqpHelper  = require("../helpers/amqp"),
    consts      = require("../helpers/constants"),
    Log         = require("log"),
    log         = new Log(),
    config      = require("../config");

/*
 * Method to connect to the rabitMQ server. Single connection in the poll of connections
 * @method connect
 * @param {} server (nameserv or ip)
 * @return
 */
module.exports.connect= function(amqpConfig)
{
  var total = amqpConfig.length;
  // global var :(
  amqpChannels = {};
  for(var i = 0; i < total; i++)
  {
    createConnection(amqpConfig[i], amqpChannels);
  }
};

function createConnection(amqpConfig, amqpChannels)
{
  amqp.connect("amqp://" + amqpConfig.user + ":" +
               amqpConfig.pass + "@" + amqpConfig.addr,
    function(err,conn)
    {
      if (err !== null) return log.error(err);

      conn.createChannel(function(err,ch)
      {
        if (err !== null) return log.error(err);

        amqpChannels[amqpConfig.name] = {config: amqpConfig, channel: ch};
        amqpHelper.setupAMQP(ch, amqpConfig, assertCallback);
      });
    });
}

function assertCallback(err,ok){
  if(err) log.error(err);
  else log.info(ok);
}

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
    amqpChannels.messages.channel.publish("delayedMessages", ", new Buffer(sms), {headers: {"x-delay": msg.ttd*1000}});

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
  amqpChannels.dlr.channel.publish("dlr", routingKey, new Buffer(dlr));
};
