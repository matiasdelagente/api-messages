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
    token         = config.backendBusiness.accessToken,
    Log           = require("log"),
    log           = new Log();

function sendToPhone(req, res)
{
  var msgId = hat(60, 36);
  singleSender(req, msgId, req.companyId);
  res.status(201).send({response: "mensaje enviado corectamente", "msgId": msgId, "referenceId" : req.body.referenceId});
}

function updateCollection(req, res)
{
  var collection    = req.body,
      totalMessages = collection.length,
      msg           = "",
      updateMsg     = {},
      status        = {},
      ok            = true,
      msgsToSend    = [],
      i             = 0;

  //Verificamos primero
  for(i = 0; i < totalMessages; i++)
  {
    msg       = collection[i];
    //build the update object
    updateMsg = {"msgId": msg.id, "status": msg.status};
    status    = helper.timestampByState(msg.status);

    if(status !== "error")
    {
      if(!updateMsg.timestamp)
      {
        updateMsg.timestamp = {};
      }

      // add the timestamp to the update object by state number
      updateMsg.timestamp[status] = new Date().getTime();
      msgsToSend.push(updateMsg);
    }
    else
    {
      ok = false;
      break;
    }
  }

  //Mandamos
  if(ok)
  {
    var msgsToSendLenght = msgsToSend.length;
    res.status(201).send({status: "OK", response: "new saved state"});
    for(i = 0; i < msgsToSendLenght; i++)
    {
      try
      {
        rabbit.update(msgsToSend[i]);
      }
      catch(e)
      {
        log.error(e);
        errorResponse(res, 422, "Status invalid");
        break;
      }
    }
  }
  else
  {
    errorResponse(res, 422, "Status invalid");
  }
}

function updateByMsgIdAndStatus(req, res)
{
  //build the update object
  var updateMsg = {"msgId": req.params.id, "status": req.body.status},
      status = helper.timestampByState(req.body.status);

  if(status !== "error")
  {
    if(!updateMsg.timestamp)
    {
      updateMsg.timestamp = {};
    }

    var response = {response: "Message updated", "status": req.body.status, "msgId": req.params.id};

    //Agregado de campos nuevos para reportar localización y confirmación de módulo de dispacher
    if(req.body.geolocalization)
    {
      updateMsg.geolocalization = req.body.geolocalization;
      response.geolocalization = req.body.geolocalization;
    }

    if(req.body.confirmed)
    {
      updateMsg.confirmed = req.body.confirmed;
      response.confirmed = req.body.confirmed;
    }
    
    // add the timestamp to the update object by state number
    updateMsg.timestamp[status] = new Date().getTime();

    // finally send the http response
    res.status(201).send(response);
    // send the update object to rabbitmq
    try
    {
      rabbit.update(updateMsg);
    }
    catch(e)
    {
      log.error(e);
      errorResponse(res, 422, "Status invalid");
    }
  }
  else
  {
    errorResponse(res, 422, "Invalid status");
  }
}

function deleteById(req, res)
{
  messagesModel.getById(req.params.id, function(msg)
  {
    if(msg !== false)
    {
      // build the update object
      var updateMsg = {"msgId":req.params.id, "disabled": true, timestamp: {disabled: new Date().getTime()} };
      // finally send the http response
      res.status(200).send({response: "Message deleted", "status": req.body.status, "msgId": req.params.id});
      // send the update object to rabbitmq
      try
      {
        rabbit.update(updateMsg);
      }
      catch(e)
      {
        log.error(e);
        errorResponse(res, 404, "Message not found");
      }
    }
    else
    {
      errorResponse(res, 404, "Message not found");
    }
  });
}

function getById(req, res)
{
  messagesModel.getById(req.params.id, function(msg)
  {
    if(msg !== false)
    {
      res.status(200).send(msg);
    }
    else
    {
      errorResponse(res, 404, "Message not found");
    }
  });
}

function getByCompanyId(req, res)
{
  messagesModel.getByCompanyId(req.query, function(msgs)
  {
    if(msgs !== false)
    {
      res.status(200).send(msgs);
    }
    else
    {
      errorResponse(res, 404, "Messages not found for company " + req.query.companyId);
    }
  });
}

function getByPhone(req, res)
{
  messagesModel.getByPhone(req.params.companyId, req.query, function(msgs)
  {
    if (msgs !== false)
    {
      res.status(200).send(msgs);
    }
    else
    {
      errorResponse(res, 404, "Messages not found for company " + req.params.companyId);
    }
  });
}

function getByPhoneWOCaptured(req, res)
{
  var callbackVersion = req.query.callbackVersion || false;
  if(callbackVersion)
  {
    res.status(200).send({"response": "processing"});
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

      var endpoint    = callbackVersion.toString().replace(":companyId", companyId.toString()),
          environment = process.env.NODE_ENV || false, secure = false;

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
    messagesModel.getByPhoneWOCaptured(req.params.companyId, req.query, function (msgs)
    {
      if(msgs !== false)
      {
        res.status(200).send(msgs);
      }
      else
      {
        errorResponse(res, 404, "Messages not found for company " + req.params.companyId);
      }
    });
  }
}

function errorResponse(res, statusCode, message)
{
  res.status(statusCode).send({status: "ERROR", response: message});
}

//msg sender function
function singleSender(req, msgId)
{
  var msg       = req.body,
      company   = req.companyId,
      username  = req.username,
      send      = true,
      code      = (typeof msg.countryCode !== "undefined" && msg.countryCode !== "") ? helper.countryCode(msg.countryCode) : false,
      message   =
      {
        payload     : helper.checkMessage(msg.msg),
        channel     : helper.checkChannel(msg.channel),
        referenceId : (typeof msg.referenceId !== "undefined" && msg.referenceId !== "") ? msg.referenceId : msgId,
        country     : (typeof msg.countryCode !== "undefined") ? msg.countryCode : "",
        type        : (typeof msg.type === "undefined") ? username : msg.type,
        ttd         : (typeof msg.ttd === "undefined" || parseInt(msg.ttd) == NaN) ? 0 : parseInt(msg.ttd),
        flags       : (typeof msg.flags === "undefined") ? config.app.defaults.flags : msg.flags,
        phone       : (code !== false) ? code + msg.phone : msg.phone,
        msgId       : msgId,
        companyId   : company
      };

  // si son sms que la app esta enviando como sms choreados, guardamos extras
  if(msg.flags == C.CAPTURED)
  {
    message.captured = helper.fillCapturedExtras(msg);
    send = false;
  }

  try
  {
    rabbit.send(message, send);
  }
  catch(e)
  {
    log.error(e);
  }
}

module.exports.delete               = deleteById;
module.exports.get                  = getById;
module.exports.getByCompanyId       = getByCompanyId;
module.exports.getByPhone           = getByPhone;
module.exports.getByPhoneWOCaptured = getByPhoneWOCaptured;
module.exports.send                 = sendToPhone;
module.exports.update               = updateByMsgIdAndStatus;
module.exports.updateCollection     = updateCollection;
