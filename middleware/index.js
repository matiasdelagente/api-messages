var validator = require("validator"),
    _         = require("lodash"),
    helpers   = require("../helpers"),
    constants = require("../helpers/constants"),
    Log       = require("log"),
    log       = new Log();

function message(req, res, next)
{
  var message = req.body;

  //Modificación para reutilizar validación para las listas
  if(!message.phone)
  {
    errorResponse(res, "Missing/malformed phone.");
  }
  else
  {
    var phone = validatePhone(message.phone, res);
    if(phone)
    {
      message.phone = phone;
      if(validateMessage(message, res))
      {
        next();
      }
    }
  }
}

function validatePhone(phone, res)
{
  if(typeof phone === "undefined" || phone === "")
  {
    errorResponse(res, "Missing/malformed phone.");
  }
  else
  {
    // if the phone comes with the + at the beginning we remove it
    phone = phone.replace("+", "");

    // if the phone is not an integer we fail
    if(!validator.isInt(phone))
    {
      log.info("not int");
      errorResponse(res, "Missing/malformed phone.");
    }
    else
    {
      return phone.replace(/\D/g,"");
    }
  }

  return false;
}

function validatePhones(phones, res)
{
  var isOk = true;

  if(_.isArray(phones) && phones.length)
  {
    for(var i=0; i < phones.length; i++)
    {
      var phone = validatePhone(phones[i], res);
      if(phone)
      {
        phones[i] = phone;
      }
      else
      {
        isOk = false;
        break;
      }
    }
  }

  if(isOk)
  {
    return phones;
  }
  else
  {
    return false;
  }
}

function validateCountry(countryCode, phone, res)
{
  // if we have a countryCode (ISO)
  if(typeof countryCode !== "undefined" && countryCode !== "")
  {
    // we validate the countryCode according to https://en.wikipedia.org/wiki/E.164
    countryCode = countryCode + "";
    if(countryCode.length > 3)
    {
      log.info("invalid countryCode");
      errorResponse(res, "Missing/malformed countryCode.");
      return false;
    }
    else
    {
      // if we have both countryCode and phone we validate both of them
      var countryCodePrefix  = helpers.countryCode(countryCode),
          internationalPhone = (countryCodePrefix + "") + (phone + "");
      if(internationalPhone.length > constants.PHONE_LENGTH)
      {
        errorResponse(res, "Malformed phone and countryCode combination.");
        return false;
      }
    }
  }
  else
  {
    // if we don't have a countryCode we validate the phone length according to https://en.wikipedia.org/wiki/E.164
    if(phone.length > constants.PHONE_LENGTH)
    {
      errorResponse(res, "Missing/malformed phone.");
      return false;
    }
  }

  return true;
}

function validateMessage(message, res)
{
  if(message.phone)
  {
    if(!validateCountry(message.countryCode, message.phone, res))
    {
      return false;
    }
  }
  else
  {
    for(var i=0; i < message.phones.length; i++)
    {
      if(!validateCountry(message.countryCode, message.phones[i], res))
      {
        return false;
      }
    }
  }

  // the phone and countryCode (if present) are correct
  if(typeof message.msg === "undefined" || message.msg == "")
  {
    errorResponse(res, "Missing/malformed message.");
    return false;
  }
  else
  {
    if(typeof message.flags === "undefined" || message.flags == "" || message.flags > constants.CAPTURED_PUSH)
    {
      errorResponse(res, "Missing/malformed flags.");
      return false;
    }
    else
    {
      if(message.referenceId && typeof message.referenceId !== "undefined" && message.referenceId.length > constants.REFERENCEID_LENGTH)
      {
        errorResponse(res, "Malformed referenceId.");
        return false;
      }
      else
      {
        if(message.ttd && typeof message.ttd !== "undefined" && message.ttd < 0)
        {
          errorResponse(res, "Malformed ttd.");
          return false;
        }
        else
        {
          if(message.type && typeof message.type !== "undefined" && message.type == "")
          {
            errorResponse(res, "Malformed type.");
            return false;
          }

          //Si el flag es constants.CAPTURED se valida status y from
          if(message.flags == constants.CAPTURED)
          {
            if(isMessageStatusInvalid(message.status))
            {
              errorResponse(res, "Malformed status.");
              return false;
            }

            if(message.from && typeof message.from !== "undefined" && message.from == "")
            {
              errorResponse(res, "Malformed from.");
              return false;
            }
          }

          return true;
        }
      }
    }
  }
}

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
  return (typeof status == "undefined" || status > constants.MSG_PERSONAL);
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
  if(_.isArray(req.body) && req.body.length)
  {
    var isOk = true;

    for(var i=0; i < req.body.length; i++)
    {
      if(!req.body[i].msg || !req.body[i].flags || !req.body[i].phones)
      {
        isOk = false;
        break;
      }
      else
      {
        var phones = validatePhones(req.body[i].phones, res);

        if(phones)
        {
          req.body[i].phones = phones;
          if(!validateMessage(req.body[i], res))
          {
            isOk = false;
            break;
          }
        }
        else
        {
          isOk = false;
          break;
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

module.exports.updateCollection = updateCollection;
module.exports.storage          = storage;
module.exports.message          = message;
module.exports.validateMessage  = validateMessage;