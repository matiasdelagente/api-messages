var validator = require("validator"),
    _         = require("lodash"),
    helpers   = require("../helpers"),
    constants = require("../helpers/constants"),
    Log       = require('log'),
    log       = new Log();

module.exports.message = function(req,res,next) {
  var message = req.body;

  // it there is no phone or empty phone or just the + sign we fail
  if(typeof message.phone === "undefined" || message.phone === "" || message.phone === "+")
  {
    return errorResponse(res, "Missing/malformed phone.");
  }
  // if the phone comes with the + at the beginning we remove it
  else
  {
    if(message.phone.startsWith("+"))
    {
      message.phone = message.phone.substring(1);
    }
  }

  // if the phone is not an integer we fail
  if(!validator.isInt(message.phone))
  {
    log.info("not int");
    return errorResponse(res, "Missing/malformed phone.");
  }
  // if we have a countryCode (ISO)
  if(typeof message.countryCode !== "undefined" && message.countryCode !== "")
  {
    // we validate the countryCode
    // according to https://en.wikipedia.org/wiki/E.164
    var countryCode = message.countryCode + "";
    if(countryCode.length > 3)
    {
      log.info("invalid countryCode");
      return errorResponse(res, "Missing/malformed countryCode.");
    }
    else
    {
      // if we have both countryCode and phone we validate both of them
      var countryCodePrefix  = helpers.countryCode(countryCode),
          internationalPhone = (countryCodePrefix + "") + (message.phone + "");
      if(internationalPhone.length > constants.PHONE_LENGTH)
      {
        return errorResponse(res, "Malformed phone and countryCode combination.");
      }
    }
  }
  // if we don't have a countryCode we validate the phone length
  // according to https://en.wikipedia.org/wiki/E.164
  else if(message.phone.length > constants.PHONE_LENGTH)
  {
    return errorResponse(res, "Missing/malformed phone.");
  }

  // the phone and countryCode (if present) are correct
  if(typeof message.msg === "undefined" || message.msg == "")
  {
    return errorResponse(res, "Missing/malformed message.");
  }
  else if(typeof message.flags === "undefined" || message.flags == "" || !validator.isInt(message.flags) || message.flags > 5)
  {
    return errorResponse(res, "Missing/malformed flags.");
  }
  else if(typeof message.referenceId !== "undefined" && message.referenceId.length > constants.REFERENCEID_LENGTH)
  {
    return errorResponse(res, "Malformed referenceId.");
  }
  else if(typeof message.ttd !== "undefined" && !validator.isInt(message.ttd))
  {
    return errorResponse(res, "Malformed ttd.");
  }
  else
  {
    req.body.phone = message.phone.replace(/\D/g,"");
    next();
  }
};


module.exports.deleteMessage = function(req,res,next)
{
  var id = req.params.id;
  if(isMessageIdInvalid(id))
  {
    errorResponse(res, "Missing/malformed msgId.");
  }
  else
  {
    next();
  }
};

function updateCollection(req, res, next)
{
  var collection  = req.body,
      errorExists = false;

  if(_.isArray(collection))
  {
    var totalMessges = collection.length;

    if(totalMessges > 0)
    {
      var msg = "";

      for(var i = 0; i < totalMessges; i++)
      {
        msg = collection[i];

        if(msg.hasOwnProperty("id") && msg.hasOwnProperty("status"))
        {
          if(_.isUndefined(msg.id))
          {
            errorExists = true;
            break;
          }

          if(isMessageStatusInvalid(msg.status))
          {
            errorExists = true;
            break;
          }

          if(msg.hasOwnProperty("campaignId"))
          {
            if(_.isUndefined(msg.campaignId))
            {
              errorExists = true;
              break;
            }
          }

          if(msg.hasOwnProperty("listId"))
          {
            if(_.isUndefined(msg.listId))
            {
              errorExists = true;
              break;
            }
          }
        }
        else
        {
          errorExists = true;
          break;
        }
      }

      if(errorExists)
      {
        res.status(422).send({status: "ERROR", response: "Messages malformed"});
      }
      else
      {
        next();
      }
    }
    else
    {
      res.status(422).send({status: "ERROR", response: "Messages malformed"});
    }
  }
  else
  {
    res.status(422).send({status: "ERROR", response: "Messages malformed"});
  }
}

module.exports.update = function(req,res,next)
{
  var message = req.body,
      id      = req.params.id;
  if(isMessageIdInvalid(id))
  {
    errorResponse(res, "Missing/malformed msgId.");
  }
  else
  {
    if(isMessageStatusInvalid(message.status))
    {
      errorResponse(res, "Missing/malformed status.");
    }
    else
    {
      next();
    }
  }
};

function errorResponse(res, resDescription)
{
  res.status(422).send({ type: "Unprocessable request", description: resDescription});
}

function isMessageStatusInvalid(status)
{
  //Se incorpora el status 6 para diferenciar mensajes personales
  return (_.isUndefined(status) || !validator.isInt(status) || Math.abs(status) > constants.MSG_PERSONAL);
}

function isMessageIdInvalid(id)
{
  return (!(id.length >= 32) || !validator.isAlphanumeric(id));
}

module.exports.get = function(req,res,next)
{
  var id = req.params.id;
  if(isMessageIdInvalid(id))
  {
    errorResponse(res, "Missing/malformed msgId.");
  }
  else
  {
    next();
  }
};

module.exports.infobip = function(req, res, next)
{
  // TODO: implement validations for message fields
  next();
};

//Agregado para validar campos recibidos en la api-storage
function storage(req, res, next)
{
  if(_.isArray(req.body))
  {
    if(req.body.length > 0)
    {
      var isOk = true;

      for(var i=0; i < req.body.length; i++)
      {
        if( !req.body[0].hasOwnProperty("type") || !req.body[0].hasOwnProperty("msg") || !req.body[0].hasOwnProperty("status") || !req.body[0].hasOwnProperty("companyId")
            ||!req.body[0].hasOwnProperty("countryCode") || !req.body[0].hasOwnProperty("from") || !req.body[0].hasOwnProperty("flags") || !req.body[0].hasOwnProperty("phones"))
        {
          isOk = false;
          break;
        }
        else
        {
          if(_.isUndefined(req.body[0].msg) || !_.isString(req.body[0].msg))
          {
            isOk = false;
            break;
          }

          if(_.isUndefined(req.body[0].type) || !_.isString(req.body[0].type))
          {
            isOk = false;
            break;
          }

          if(_.isUndefined(req.body[0].flags) || !validator.isInt(req.body[0].flags) || req.body[0].flags > constants.CAPTURED_PUSH)
          {
            isOk = false;
            break;
          }

          if(isMessageStatusInvalid(req.body[0].status))
          {
            isOk = false;
            break;
          }

          if(_.isUndefined(req.body[0].countryCode) || !_.isString(req.body[0].countryCode))
          {
            isOk = false;
            break;
          }

          if(_.isUndefined(req.body[0].from) || !_.isString(req.body[0].from))
          {
            isOk = false;
            break;
          }

          if(!_.isArray(req.body[0].phones))
          {
            isOk = false;
            break;
          }
          else
          {
            if(req.body[0].phones.length == 0)
            {
              isOk = false;
              break;
            }
          }
        }
      }

      if(isOk)
      {
        next();
      }
      else
      {
        res.status(422).send({status: "ERROR", response: "Messages malformed"});
      }
    }
    else
    {
      res.status(422).send({status: "ERROR", response: "Messages malformed"});
    }
  }
  else
  {
    res.status(422).send({status: "ERROR", response: "Messages malformed"});
  }
}

module.exports.updateCollection = updateCollection;
module.exports.storage          = storage;