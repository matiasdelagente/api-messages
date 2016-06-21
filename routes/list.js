/**
 * rutas protegidas Send y Request de SMS
 */

var hat             = require('hat').rack(),
    rabbit          = require('../amqp'),
    helper          = require('../helpers'),
    config          = require('../config'),
    C               = require('../helpers/constants'),
    messagesModel   = require('../db/models/messages');

module.exports.send = function(req, res, next)
{
  var msgId = hat(60, 36);
  res.status(201).send({status: 'ok', response: 'List being processed', 'msgListID': msgId});
  listSender(req, msgId);
}

module.exports.get = function(req, res, next)
{
  messagesModel.getListById(req.params.id, function(list)
  {
    if(list !== false)
    {
      res.status(200).send(list);
    }
    else
    {
      res.status(404).send({status: 'ERROR', response: 'List not found'});
    }
  });
}

function listSender(req, msgId)
{
  var i         = 0,
      list      = req.body,
      company   = req.companyId,
      username  = req.username;

  for(var element in list)
  {
     var message = {
      user         : username,
      payload      : helper.checkMessage(list[element].msg),
      channel      : helper.checkChannel(list[element].channel),
      referenceId  : (typeof list[element].referenceId !== "undefined" && list[element].referenceId !== "") ? list[element].referenceId : msgId,
      country      : list[element].countryCode,
      type         : (typeof list[element].type === "undefined") ? username : list[element].type,
      ttd          : (typeof list[element].ttd === "undefined" || isNaN(parseInt(list[element].ttd))) ? 0 : parseInt(list[element].ttd),
      listId       : msgId,
      flags        : (typeof list[element].flags === "undefined") ? config.app.defaults.flags : list[element].flags,
      companyId    : company
    };

    // if the message has been captured by our app, we set the captured extra fields
    var send = true;
    if(list[element].flags == C.CAPTURED)
    {
      message.captured = helper.fillCapturedExtras(list[element]);
      // we set send to false, so the message is not sent to the user's phone
      // since we captured this message
      send = false;
    }

    var code = (typeof message.country !== "undefined" && message.country !== "")
               ? helper.countryCode(message.country) : "";

    for(var phone in list[element].phones)
    {
        message.phone = code + list[element].phones[phone];
        message.msgId = msgId + '000' + i;
        rabbit.send(message, send);
        i++;
    }
  }
}
