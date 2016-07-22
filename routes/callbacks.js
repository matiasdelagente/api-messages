"use strict";

var rabbit = require('../amqp');


module.exports.infobip = function(req, res)
{
  var dlr = req.body;
  dlr.smsSender = "infobip";
  rabbit.sendToCallbackExchange(req.body, "i");
  res.status(200).send();
}


module.exports.nexmo = function(req, res)
{
  var dlr = req.body;
  dlr.smsSender = "nexmo";
  rabbit.sendToCallbackExchange(req.body, "x");
  res.status(200).send();
}