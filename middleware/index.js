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
    var phone = validatePhone(message.phone);
    if(phone)
    {
      message.phone = phone;
      if(validateMessage(message))
      {
        return next();
      }
      else
      {
        errorResponse(res, "Missing/malformed phone.");
      }
    }
    else
    {
      errorResponse(res, "Missing/malformed phone.");
    }
  }
}

function validatePhone(phone)
{
  if(typeof phone === "undefined" || phone === "")
  {
    return false;
  }
  else
  {
    // if the phone comes with the + at the beginning we remove it
    phone = phone.replace("+", "");

    // if the phone is not an integer we fail
    if(!validator.isInt(phone))
    {
      return false;
    }
    else
    {
      return phone.replace(/\D/g,"");
    }
  }
}

function validatePhones(phones)
{
  var isOk = true;

  if(_.isArray(phones) && phones.length)
  {
    for(var i=0; i < phones.length; i++)
    {
      var phone = validatePhone(phones[i]);
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

function validateCountryCodeAndPhone(countryCode, phone)
{
  // if we have a countryCode (ISO)
  if(typeof countryCode !== "undefined" && countryCode !== "")
  {
    // we validate the countryCode according to https://en.wikipedia.org/wiki/E.164
    countryCode = countryCode + "";
    if(countryCode.length > constants.COUNTRY_CODE_LENGTH)
    {
      return false;
    }
    else
    {
      // if we have both countryCode and phone we validate both of them
      var countryCodePrefix  = helpers.countryCode(countryCode),
          internationalPhone = (countryCodePrefix + "") + (phone + "");
      if(internationalPhone.length > constants.PHONE_LENGTH)
      {
        return false;
      }
    }
  }
  else
  {
    // if we don't have a countryCode we validate the phone length according to https://en.wikipedia.org/wiki/E.164
    if(phone.length > constants.PHONE_LENGTH)
    {
      return false;
    }
  }

  return true;
}

function validateMessage(message)
{
  if(message.phone)
  {
    if(!validateCountryCodeAndPhone(message.countryCode, message.phone))
    {
      return false;
    }
  }
  else
  {
    for(var i=0; i < message.phones.length; i++)
    {
      if(!validateCountryCodeAndPhone(message.countryCode, message.phones[i]))
      {
        return false;
      }
    }
  }

  // the phone and countryCode (if present) are correct
  if(typeof message.msg === "undefined" || message.msg == "")
  {
    return false;
  }
  else
  {
    if(typeof message.flags === "undefined" || message.flags == "" || message.flags > constants.CAPTURED_PUSH)
    {
      return false;
    }
    else
    {
      if(message.referenceId && typeof message.referenceId !== "undefined" && message.referenceId.length > constants.REFERENCEID_LENGTH)
      {
        return false;
      }
      else
      {
        if(message.ttd && typeof message.ttd !== "undefined" && message.ttd < 0)
        {
          return false;
        }
        else
        {
          if(message.type && typeof message.type !== "undefined" && message.type == "")
          {
            return false;
          }

          //Si el flag es constants.CAPTURED se valida status y from
          if(message.flags == constants.CAPTURED)
          {
            if(isMessageStatusInvalid(message.status))
            {
              return false;
            }

            if(message.from && typeof message.from !== "undefined" && message.from == "")
            {
              return false;
            }
          }

          return true;
        }
      }
    }
  }
}

function deleteMessage(req,res,next)
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
}

function updateCollection(req, res, next)
{
  var collection  = req.body,
      errorExists = false;

  if(_.isArray(collection) && collection.length)
  {
    var totalMessges  = collection.length,
        msg           = "";

    for(var i = 0; i < totalMessges; i++)
    {
      msg = collection[i];

      if(msg.id && msg.status)
      {
        if(typeof msg.id === "undefined")
        {
          errorExists = true;
          break;
        }

        if(isMessageStatusInvalid(msg.status))
        {
          errorExists = true;
          break;
        }

        if(msg.campaignId && typeof msg.campaignId === "undefined")
        {
          errorExists = true;
          break;
        }

        if(msg.listId && typeof msg.listId === "undefined")
        {
          errorExists = true;
          break;
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
      return next();
    }
  }
  else
  {
    res.status(422).send({status: "ERROR", response: "Messages malformed"});
  }
}

function update(req, res, next)
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
      //Agregado de coordenadas en la confirmación de lectura, se incluye la fuente de las coordenadas
      if( message.geolocalization && (typeof message.geolocalization.latitude === "undefined" || typeof message.geolocalization.longitude === "undefined" || _.isNaN(message.geolocalization.latitude) ||
          _.isNaN(message.geolocalization.longitude) || typeof message.geolocalization.source === "undefined"))
      {
        errorResponse(res, "Missing/malformed geolocalization.");
      }
      else
      {
        //Agregado de confirmación de dispacher
        if(message.confirmed && (typeof message.confirmed === "undefined"))
        {
          errorResponse(res, "Missing/malformed dispacher.");
        }
        else
        {
          return next();
        }
      }
    }
  }
}

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

function get(req,res,next)
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
}

function infobip(req, res, next)
{
  // TODO: implement validations for message fields
  next();
}


function nexmo(req, res, next)
{
  // TODO: implement validations for message fields
  next();
}

function clickatell(req, res, next)
{
  // TODO: implement validations for message fields
  next();
}

//Agregado para validar campos recibidos en la api-storage
function sendMessagesList(req, res, next)
{
  if(_.isArray(req.body) && req.body.length)
  {
    var isOk          = true,
        totalMessages = req.body.length;

    for(var i=0; i < totalMessages; i++)
    {
      if(!req.body[i].msg || !req.body[i].flags || !req.body[i].phones)
      {
        isOk = false;
        break;
      }
      else
      {
        var phones = validatePhones(req.body[i].phones);

        if(phones)
        {
          req.body[i].phones = phones;
          if(!validateMessage(req.body[i]))
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
module.exports.sendMessagesList = sendMessagesList;
module.exports.message          = message;
module.exports.validateMessage  = validateMessage;
module.exports.update           = update;
module.exports.infobip          = infobip;
module.exports.nexmo            = nexmo;
module.exports.clickatell       = clickatell;
module.exports.get              = get;
module.exports.deleteMessage    = deleteMessage;