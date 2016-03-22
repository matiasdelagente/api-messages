/**
 * rutas protegidas Send y Request de SMS
 */

var rabbit        = require('../amqp'),
    helper        = require('../helpers'),
    hat           = require('hat').rack(),
    config        = require('../config'),
    C             = require('../helpers/constants'),
    messagesModel = require('../db/models/messages');

module.exports.send = function(req, res, next){
  var msgId = hat(60,36);
  singleSender(req, msgId, req.companyId);
  res.status(201).send({response: 'mensaje enviado corectamente', 'msgId': msgId});
}

module.exports.updateCollection = function(req, res, next){
  var collection = req.body,
      totalMessages = collection.length,
      msg = ''
      updateMsg = {},
      status = {};

  for (var i = 0; i < totalMessages; i++) {
    msg = collection[i];
    //build the update object
    updateMsg = {'msgId': msg.id, 'status': msg.status},
    status = helper.timestampByState(msg.status);
    if(status !== "error")
    {
      if(!updateMsg.hasOwnProperty("timestamp")) updateMsg.timestamp = {};
      // add the timestamp to the update object by state number
      updateMsg.timestamp[status] = new Date().getTime();
      // send the update object to rabbitmq
      rabbit.update(updateMsg);
      // finally send the http response
      res.status(201).send({response: 'nuevo estado guardado','status': req.body.status, 'msgId': req.params.id});
    }
    else
      errorResponse(res, 'status inválido');
  };
}

module.exports.update = function(req, res, next){

  //build the update object
  var updateMsg = {'msgId': req.params.id, 'status': req.body.status},
      status = helper.timestampByState(req.body.status);

  if(status !== "error")
  {
    if(!updateMsg.hasOwnProperty("timestamp")) updateMsg.timestamp = {};
    // add the timestamp to the update object by state number
    updateMsg.timestamp[status] = new Date().getTime();
    // send the update object to rabbitmq
    rabbit.update(updateMsg);
    // finally send the http response
    res.status(201).send({response: 'nuevo estado guardado','status': req.body.status, 'msgId': req.params.id});
  }
  else
    errorResponse(res, 'status inválido');
}

module.exports.delete = function(req, res, next){
  messagesModel.getById(req.params.id, function(msg){
    if(msg !== false)
    {
      // build the update object
      var updateMsg = {'msgId':req.params.id, 'disabled': true, timestamp: {disabled: new Date().getTime()} };
      // send the update object to rabbitmq
      rabbit.update(updateMsg);
      // finally send the http response
      res.status(200).send({response: 'mensaje borrado', 'status': req.body.status, 'msgId': req.params.id});
    }
    else
      errorResponse(res, 'mensaje no encontrado');
  });
}

module.exports.get = function(req, res, next){
  messagesModel.getById(req.params.id, function(msg){
    if(msg !== false)
      res.status(200).send(msg);
    else
      errorResponse(res, 'mensaje no encontrado');
  });
}

module.exports.getByCompanyId = function(req, res, next){
  messagesModel.getByCompanyId(req.query, function(msgs){
    if(msgs !== false)
      res.status(200).send(msgs);
    else
      errorResponse(res, 'mensajes no encontrados para la compañía ' + req.query.companyId);
  });
}

module.exports.getByPhone = function(req, res, next){
  messagesModel.getByPhone(req.params.companyId, req.query, function(msgs){
    if(msgs !== false)
      res.status(200).send(msgs);
    else
      errorResponse(res, 'mensajes no encontrados para la compañía ' + req.query.companyId);
  });
}

function errorResponse(res, message){
  res.status(204).send({status: 'ERROR', response: message});
}

//msg sender function
function singleSender(req, msg_id){
  var msg       = req.body,
      company   = req.companyId,
      username  = req.username,
      send      = true,
      code      = (msg.countryCode != undefined) ? helper.countryCode(msg.countryCode) : "",
      message   = {
        payload   : helper.checkMessage(msg.msg),
        channel   : helper.checkChannel(msg.channel),
        country   : (msg.countryCode != undefined) ? msg.countryCode : "",
        type      : (msg.type === undefined) ? username : msg.type,
        ttd       : (msg.ttd === undefined || parseInt(msg.ttd) == NaN) ? 0 : parseInt(msg.ttd),
        flags     : (msg.flags === undefined) ? config.app.defaults.flags : msg.flags,
        phone     : code + msg.phone,
        msgId     : msg_id,
        companyId : company
      };

    // si son sms que la app esta enviando como sms choreados, guardamos extras
    if(msg.flags == C.CAPTURED){
      message.captured = helper.fillCapturedExtras(msg);
      send = false;
    }

    rabbit.send(message, send);
}
