
module.exports.setupAMQP = function(ch, amqpConfig, assertCallback)
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