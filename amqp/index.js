var amqp            = require("amqplib/callback_api"),
    config          = require("../config"),
    IncomingWebhook = require("@slack/client").IncomingWebhook,
    _               = require("lodash"),
    errorReportConf = config.errorReporting,
    slack           = new IncomingWebhook(errorReportConf.url),
    amqpHelper      = require("../helpers/amqp"),
    bof             = require('backoff'),
    consts          = require("../helpers/constants"),
    channelBackOff  = null,
    processKilled   = false,
    nodeEnv         = process.env.NODE_ENV || 'development',
    Log             = require("log"),
    log             = new Log();


/*
 * Method to connect to the rabitMQ server. Single connection in the poll of connections
 * @method connect
 * @param {} server (nameserv or ip)
 * @return
 */
module.exports.connect = function(amqpConfig)
{
  var total = amqpConfig.length,
      connBackOff = null;

  // global var :(
  amqpChannels = {};

  for(var i = 0; i < total; i++)
  {
    connBackOff = initializeBackOff(amqpConfig[i]);
    amqpConfig[i].backOffFunction = connBackOff;
    createConnection(amqpConfig[i], errorEstablishingConnection);
  }
};

/*
 * Creates a new connection to AMQP and adds reconnection back-off.
 * It also attachs a hook to close this connection in case the NodeJS process is terminated
 */
function createConnection(amqpConfig, cb)
{
  amqp.connect("amqp://" + amqpConfig.user + ":" + amqpConfig.pass + "@" + amqpConfig.addr,
    function(err, connection)
    {
      if (err !== null)
      {
        // we call the callback with an error so it starts the backoff to reconnect
        return cb(err, amqpConfig.backOffFunction);
      }

      connection.on("error", function(err)
      {
        log.warning("Connection error event emitted.");
        onConnectionError(amqpConfig);
      });

      connection.on("close", function()
      {
        log.warning("Connection close event emitted.");
        if(!processKilled)
        {
          onConnectionError(amqpConfig);
        }
      });

      connection.createChannel(function(err,ch)
      {
        if (err !== null) return log.error(err);

        amqpChannels[amqpConfig.name] = {config: amqpConfig, channel: ch};
        amqpHelper.setupAMQP(ch, amqpConfig, assertCallback);
      });

      process.once('SIGINT', function()
      {
        processKilled = true;
        log.warning("Received SIGINT process signal. Closing AMQP connection to " + amqpConfig.addr);

        connection.close();
      });

      // we report the error to Slack
      var reportMessage = errorReportConf.messages.connectionEstablished;
      reportMessageToSlack(reportMessage, amqpConfig, amqpConfig);
      // we call the callback with no error, so it resets the backoff
      cb(null, amqpConfig.backOffFunction);
    });
}

function errorEstablishingConnection(err, backOffFunction)
{
  if(err)
  {
    if(backOffFunction !== undefined)
    {
      backOffFunction.backoff(err);
    }
    else
    {
      log.error("Trying to access an undefined backOff function");
    }
  }
  else
  {
    backOffFunction.reset();
  }
}

function onConnectionError(amqpConfig)
{
  log.error("AMQP connection error occurred. Re-establishing connection.");
  // we report the error to Slack
  var reportMessage = errorReportConf.messages.connectionError;
  reportMessageToSlack(reportMessage, amqpConfig);
  // let's try to reconnect
  createConnection(amqpConfig, errorEstablishingConnection);
}

function initializeBackOff(amqpConfig)
{
  var reconnectionConfig = amqpConfig.reconnection;
  var backOff = bof.exponential(reconnectionConfig.properties);
  if(reconnectionConfig.hasOwnProperty("failAfter"))
  {
    backOff.failAfter(reconnectionConfig.failAfter);
  }

  backOff.on('backoff', function(number, delay)
  {
    // Do something when backoff starts, e.g. show to the
    // user the delay before next reconnection attempt.
    log.info("Starting to reconnect to " + amqpConfig.name + " AMQP at " +
             amqpConfig.addr + ". Attempt number " + (number+1) + ' - ' + delay + 'ms');
  });

  // Emitted when a backoff operation is done.
  // Signals that the failing operation should be retried
  backOff.on('ready', function(number, delay)
  {
    // we try to recreate the connection
    createConnection(amqpConfig, errorEstablishingConnection);
  });

  // Do something when the maximum number of backoffs is reached.
  backOff.on('fail', function()
  {
    var errorMessage = "Fatal Error. Could not connect to AMQP after several attempts." +
      "You should restart the process after the networking issues are solved.";
    log.error(errorMessage);

    // we report the error to Slack
    var reportMessage = errorReportConf.messages.connectionFatalError;
    reportMessageToSlack(reportMessage, amqpConfig);
    process.exit(1);
  });
  return backOff;
}

function assertCallback(err, ok)
{
  if(err) log.error(err);
  else log.info(ok);
}

function reportMessageToSlack(message, amqpConfig)
{
  if(nodeEnv !== "development")
  {
    var messageProperties = errorReportConf.messageProperties,
      notification      =  _.merge(messageProperties, message),
      title             = notification.attachments[0].title;

    title = replaceAll(title, "{connHost}", amqpConfig.addr);
    title = replaceAll(title, "{connName}", amqpConfig.name);
    notification.attachments[0].title = title;
    notification.attachments[0].fallback = notification.attachments[0].title;
    slack.send(notification, function()
    {
      log.info("Notification reported correctly to Slack.", title);
    });
  }
}

function replaceAll(target, search, replacement)
{
  return target.split(search).join(replacement);
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
