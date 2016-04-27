var validator = require("validator");

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
}


module.exports.deleteMessage = function(req,res,next) {
  var id = req.params.id;
   if(isMessageIdInvalid(id))
    errorResponse(res, 'Missing/malformed msgId.');
  else
    next();
}

module.exports.updateCollection = function(req,res,next) {
  var collection = req.body,
      errorExists = false;

  if(Object.prototype.toString.call(collection) === '[object Array]'){
    var totalMessges = collection.length,
        msg = "";
    for(var i = 0; i < totalMessges; i++){
      msg = collection[i];
      if(isMessageStatusInvalid(message.status)){
        errorExists = true;
        break;
      }
    };
    if(errorExists)
      errorResponse(res, 'Missing/malformed status.');
    else next();
  }
  else {
    errorResponse(res, 'Body is not an Array.');
  }
}

module.exports.update = function(req,res,next) {
  var message = req.body;
  if(isMessageStatusInvalid(message.status))
    errorResponse(res, 'Missing/malformed status.');
  else next();
}

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
}
