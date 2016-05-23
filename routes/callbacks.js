"use strict";

var rabbit = require('../amqp');


module.exports.infobip = function(req, res)
{
  rabbit.sendToInfobip(req.body);
  res.status(200).send();
}