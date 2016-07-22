
module.exports.setupAMQP = function(ch, amqpConfig, assertCallback)
{
  //console.log(amqpConfig);
  // assert the AMQP queues
  //amqpConfig = JSON.parse(amqpConfig);
  var queueData, exchangeData, bindingData, queueOptions;
  for(var queue in amqpConfig.queues)
  {
    queueData = amqpConfig.queues[queue];
    queueOptions = JSON.stringify(queueData.options);

    //ch.assertQueue(queueData.name, queueOptions, assertCallback);
  }

  // assert the AMQP exchanges and it's bindings
  var exchangeOptions;
  for(var exchange in amqpConfig.exchanges)
  {
    exchangeData = amqpConfig.exchanges[exchange];
    exchangeOptions = JSON.stringify(exchangeData.options);
    ch.assertExchange(exchangeData.name, exchangeData.type, exchangeOptions, assertCallback);
    // the exchange->queue bindings
    var bindings = JSON.stringify(exchangeData.bindings),
        routingKey = "";
    for(var queueBinding in bindings.queues)
    {
      bindingData = bindings.queues[queueBinding];
      routingKey = typeof bindingData.routingKey !== "undefined" ? bindingData.routingKey : "";
      ch.bindQueue(bindingData.name, exchangeData.name, routingKey, assertCallback);
    }
    // the exchange->exchange bindings
    for(var exchangeBinding in bindings.exchanges)
    {
      bindingData = exchangeData.bindings.queues[exchangeBinding];
      ch.bindExchange(bindingData.name, exchangeData.name, bindingData.routingKey, assertCallback);
    }
  }
}