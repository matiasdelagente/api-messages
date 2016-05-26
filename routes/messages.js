/**
 * rutas protegidas Send y Request de SMS
 */

var rabbit        = require("../amqp"),
    helper        = require("../helpers"),
    api           = require("../helpers/apiCaller"),
    hat           = require("hat").rack(),
    config        = require("../config"),
    C             = require("../helpers/constants"),
    messagesModel = require("../db/models/messages"),
    host          = config.backendBusiness.host,
    port          = config.backendBusiness.port,
    version       = config.backendBusiness.version,
    token         = config.backendBusiness.accessToken;

function sendToPhone(req, res, next){
  var msgId = hat(60, 36);
  singleSender(req, msgId, req.companyId);
  res.status(201).send({response: "mensaje enviado corectamente", 'msgId': msgId, 'referenceId' : req.body.referenceId});
}

function updateCollection(req, res, next){
  var collection = req.body,
      totalMessages = collection.length,
      msg = '',
      updateMsg = {},
      status = {};

  for (var i = 0; i < totalMessages; i++) {
    msg = collection[i];
    //build the update object
    updateMsg = {'msgId': msg.id, 'status': msg.status};
    status = helper.timestampByState(msg.status);
    if(status !== "error")
    {
      if(!updateMsg.hasOwnProperty("timestamp")) updateMsg.timestamp = {};
      // add the timestamp to the update object by state number
      updateMsg.timestamp[status] = new Date().getTime();
      // send the update object to rabbitmq
      rabbit.update(updateMsg);
      // finally send the http response
      res.status(201).send({response: "nuevo estado guardado",'status': req.body.status, 'msgId': req.params.id});
    }
    else
    {
      errorResponse(res, 422, "status inválido");
    }
  }
}

function updateByMsgIdAndStatus(req, res, next){

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
    res.status(201).send({response: "nuevo estado guardado",'status': req.body.status, 'msgId': req.params.id});
  }
  else {
    errorResponse(res, 422, "status inválido");
  }
}

function deleteById(req, res, next){
  messagesModel.getById(req.params.id, function(msg){
    if(msg !== false)
    {
      // build the update object
      var updateMsg = {'msgId':req.params.id, 'disabled': true, timestamp: {disabled: new Date().getTime()} };
      // send the update object to rabbitmq
      rabbit.update(updateMsg);
      // finally send the http response
      res.status(200).send({response: "mensaje borrado", 'status': req.body.status, 'msgId': req.params.id});
    }
    else {
      errorResponse(res, 404, "mensaje no encontrado");
    }
  });
}

function getById(req, res, next){
  messagesModel.getById(req.params.id, function(msg){
    if(msg !== false) {
      res.status(200).send(msg);
    }else {
      errorResponse(res, 404, "mensaje no encontrado");
    }
  });
}

function getByCompanyId(req, res, next){
  messagesModel.getByCompanyId(req.query, function(msgs){
    if(msgs !== false) {
      res.status(200).send(msgs);
    }else {
      errorResponse(res, 404, "mensajes no encontrados para la compañía " + req.query.companyId);
    }
  });
}

function getByPhone(req, res, next) {
  messagesModel.getByPhone(req.params.companyId, req.query,
    function (msgs)
    {
      if (msgs !== false)
      {
        res.status(200).send(msgs);
      }
      else
      {
        errorResponse(res, 404, "mensajes no encontrados para la compañía " + req.params.companyId);
      }
    }
  );
}

function getByPhoneWOCaptured(req, res, next)
{
  var callbackVersion = req.query.callbackVersion || false;
  if(callbackVersion)
  {
    res.status(200).send({"response":"processing"});
    var companyId = req.params.companyId;
    messagesModel.getByPhoneWOCaptured(companyId, req.query, callbackPhones);
    function callbackPhones(msgs)
    {
      var response     = {};
      response.apiCall = C.API_CALL.toString();
      if (msgs !== false)
      {
        response.success = true;
        response.data    = JSON.stringify(msgs);
      }
      else
      {
        response.success = false;
        response.message = "messages.notFound";
        response.data    = JSON.stringify([]);
      }
      var endpoint = callbackVersion.toString().replace(":companyId", companyId.toString());
      var environment = process.env.NODE_ENV || false, secure = false;
      if(environment === "development")
      {
        secure = true;
      }
      api.performRequest(host, port, version, endpoint, "GET", token, response,
        function(response)
        {
          if(response)
          {
            log.info("successfullyCallToBackendBusiness");
          }
        }, secure
      )
    }
  }
  else
  {
    messagesModel.getByPhoneWOCaptured(req.params.companyId, req.query,
      function (msgs)
      {
        if (msgs !== false)
        {
          res.status(200).send(msgs);
        }
        else
        {
          errorResponse(res, 404, "mensajes no encontrados para la compañía " + req.params.companyId);
        }
      }
    );
  }
}

function errorResponse(res, statusCode, message){
  res.status(statusCode).send({status: 'ERROR', response: message});
}

//msg sender function
function singleSender(req, msgId){
  var msg       = req.body,
      company   = req.companyId,
      username  = req.username,
      send      = true,
      code      = (msg.countryCode != undefined) ? helper.countryCode(msg.countryCode) : "",
      message   = {
        payload     : helper.checkMessage(msg.msg),
        channel     : helper.checkChannel(msg.channel),
        referenceId : msg.referenceId != "" ? msg.referenceId : msgId,
        country     : (msg.countryCode != undefined) ? msg.countryCode : "",
        type        : (msg.type === undefined) ? username : msg.type,
        ttd         : (msg.ttd === undefined || parseInt(msg.ttd) == NaN) ? 0 : parseInt(msg.ttd),
        flags       : (msg.flags === undefined) ? config.app.defaults.flags : msg.flags,
        phone       : code + msg.phone,
        msgId       : msgId,
        companyId   : company
      };

    // si son sms que la app esta enviando como sms choreados, guardamos extras
    if(msg.flags == C.CAPTURED){
      message.captured = helper.fillCapturedExtras(msg);
      send = false;
    }

    rabbit.send(message, send);
}

module.exports.delete               = deleteById;
module.exports.get                  = getById;
module.exports.getByCompanyId       = getByCompanyId;
module.exports.getByPhone           = getByPhone;
module.exports.getByPhoneWOCaptured = getByPhoneWOCaptured;
module.exports.send                 = sendToPhone;
module.exports.update               = updateByMsgIdAndStatus;
module.exports.updateCollection     = updateCollection;
