/**
 * rutas protegidas Send y Request de SMS
 */

var hat             = require('hat').rack(),
    rabbit          = require('../amqp'),
    helper          = require('../helpers'),
    config          = require('../config'),
    C               = require('../helpers/constants'),
    messagesModel   = require('../db/models/messages');

module.exports.send = function(req, res, next) {
  var msgId = hat(60,36);
  res.status(201).send({status: 'ok', response: 'procesamiento en curso', 'msgListID': msgId});
  listSender(req, msgId);
}

module.exports.get = function(req, res, next) {
  messagesModel.getListById(req.params.id,function(list) {
    if(list !== false)
      res.status(200).send(list);
    else
      res.status(404).send({status: 'ERROR', response: 'lista no encontrada'});
  });
}

function listSender(req, msgId) {
  var i=0;
  var list = req.body;
  var company = req.companyId;
  var username = req.username;

  for(element in list) {
     var message = {
      user                : username,
      payload             : helper.checkMessage(list[element].msg),
      channel             : helper.checkChannel(list[element].channel),
      referenceId         : list[element].referenceId != "" ? list[element].referenceId : msgId,
      country             : list[element].countryCode,
      type                : (list[element].type === undefined) ? username : list[element].type,
      ttd                 : (list[element].ttd == undefined || isNaN(parseInt(list[element].ttd))) ? 0 : parseInt(list[element].ttd),
      listId              : msgId,
      flags               : (list[element].flags === undefined) ? config.app.defaults.flags : list[element].flags,
      companyId           : company
    };
    // si son sms que la app esta enviando como sms choreados, guardamos extras
    var send=true;
    if(list[element].flags == C.CAPTURED)
    {
      message.captured = helper.fillCapturedExtras(list[element]);
      send = false;

    }

    var code = (list[element].country != undefined)?helper.countryCode(list[element].country):"";
    for(phone in list[element].phones) {
        message.phone = code + list[element].phones[phone];
        message.msgId = msgId + '000' + i;
        rabbit.send(message,send);
        i++;
      }
    }
}
