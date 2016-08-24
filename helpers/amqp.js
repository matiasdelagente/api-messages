var amqp            = require("amqplib/callback_api"),
    IncomingWebhook = require("@slack/client").IncomingWebhook,
    config          = require("../config"),
    _               = require("lodash"),
    errorReportConf = config.errorReporting,
    slack           = new IncomingWebhook(errorReportConf.url),
    bof             = require('backoff'),
    processKilled   = false,
    amqpChannels    = null,
    nodeEnv         = process.env.NODE_ENV || 'development',
    Log             = require("log"),
    log             = new Log();

/*
 * Creates a new connection to AMQP and adds reconnection back-off.
 * It also attachs a hook to close this connection in case the NodeJS process is terminated
 */
function createConnection(amqpConfig)
{
  amqp.connect("amqp://" + amqpConfig.user + ":" + amqpConfig.pass + "@" + amqpConfig.addr,
    function(err, connection)
    {
      if (err !== null)
      {
        // we call the callback with an error so it starts the backoff to reconnect
        return errorEstablishingConnection(err, amqpConfig.backOffFunction);
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
        setupAMQP(ch, amqpConfig, assertCallback);
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
      errorEstablishingConnection(null, amqpConfig.backOffFunction);
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
  createConnection(amqpConfig);
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
    createConnection(amqpConfig);
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


function setupAMQP(ch, amqpConfig, assertCallback)
{
  // assert the AMQP queues
  var queueData, exchangeData, bindingData;
  for(var queue in amqpConfig.queues)
  {
    queueData = amqpConfig.queues[queue];
    ch.assertQueue(queueData.name, queueData.options, assertCallback);
  }

  // assert the AMQP exchanges and it's bindings
  var exchangeOptions, bindings, routingKey;
  for(var exchange in amqpConfig.exchanges)
  {
    exchangeData = amqpConfig.exchanges[exchange];
    exchangeOptions = JSON.stringify(exchangeData.options);
    ch.assertExchange(exchangeData.name, exchangeData.type, exchangeOptions, assertCallback);
    // the exchange->queue bindings
    bindings = JSON.stringify(exchangeData.bindings);
    routingKey = "";
    for(var queueBinding in exchangeData.bindings.queues)
    {
      bindingData = exchangeData.bindings.queues[queueBinding];
      routingKey = typeof bindingData.routingKey !== "undefined" ? bindingData.routingKey : "";
      ch.bindQueue(bindingData.name, exchangeData.name, routingKey, {}, assertCallback);
    }
    // the exchange->exchange bindings
    for(var exchangeBinding in exchangeData.bindings.exchanges)
    {
      bindingData = exchangeData.bindings.queues[exchangeBinding];
      ch.bindExchange(bindingData.name, exchangeData.name, bindingData.routingKey, {}, assertCallback);
    }
  }
}


function initializeAMQP(amqpConfig, channels)
{
  var total = amqpConfig.length;

  amqpChannels = channels;

  for(var i = 0; i < total; i++)
  {
    // we save the backOff function for later reuse with each connection
    amqpConfig[i].backOffFunction = initializeBackOff(amqpConfig[i]);
    // we create the connection
    createConnection(amqpConfig[i]);
  }
}

module.exports.initializeAMQP = initializeAMQP;
