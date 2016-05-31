var validator = require("validator");
var _     		= require("lodash");

module.exports.message = function(req,res,next) {
  var message = req.body;
  if(typeof message.phone === "undefined" || message.phone == '' || !validator.isDecimal(message.phone) || message.phone.length >= 20)
    errorResponse(res, 'Missing/malformed Phone.');
  else if(typeof message.msg === "undefined" || message.msg == '')
    errorResponse(res, 'Missing/malformed Message.');
  else if(typeof message.flags === "undefined" || message.flags == '' || !validator.isInt(message.flags) || message.flags > 5)
    errorResponse(res, 'Missing/malformed flags.');
  else if(typeof message.referenceId !== "undefined" && message.referenceId.length > 30)
    errorResponse(res, 'Malformed referenceId.');
  else
  {
    req.body.phone = req.body.phone.replace(/\D/g,'');
    next();
  }
};


module.exports.deleteMessage = function(req,res,next) {
  var id = req.params.id;
   if(isMessageIdInvalid(id))
    errorResponse(res, 'Missing/malformed msgId.');
  else
    next();
};

function updateCollection(req, res, next)
{
  var collection  = req.body;
  var errorExists = false;

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

module.exports.update = function(req,res,next) {
  var message = req.body;
  if(isMessageStatusInvalid(message.status))
    errorResponse(res, 'Missing/malformed status.');
  else next();
};

function errorResponse(res, resDescription)
{
  res.status(422).send({ type: 'Unprocessable request', description: resDescription});
}

function isMessageStatusInvalid(status)
{
  return (status === undefined || Math.abs(status) > 5);
}

function isMessageIdInvalid(id)
{
  return (!(id.length >= 32) || !validator.isAlphanumeric(id));
}

module.exports.get = function(req,res,next) {
  var id = req.params.id;
  if(isMessageIdInvalid(id))
    errorResponse(res, 'Missing/malformed msgId.');
  else next();
};

module.exports.infobip = function(req, res, next)
{
  // TODO: implement validations for message fields
  next();
};

module.exports.updateCollection = updateCollection;