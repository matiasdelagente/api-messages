"use strict";

var rabbit = require('../amqp');


module.exports.infobip = function(req, res)
{
  var dlr = req.body;
  dlr.smsSender = "infobip";
  res.status(200).send({"status": "OK"});
  rabbit.sendToCallbackExchange(req.body, "i");
}

module.exports.nexmo = function(req, res)
{
  var dlr = req.query;
  dlr.smsSender = "nexmo";
  res.status(200).send({"status": "OK"});
  rabbit.sendToCallbackExchange(req.body, "x");
}

module.exports.clickatell = function(req, res)
{
  var dlr = req.body;
  dlr.smsSender = "clickatell";
  res.status(200).send({"status": "OK"});
  rabbit.sendToCallbackExchange(req.body, "t");
}