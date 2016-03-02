var validator = require("validator");

module.exports.message = function(req,res,next) {
  var message = req.body;
  if(message.phone == undefined || message.phone == '' || !validator.isDecimal(message.phone) || message.phone.length >= 20)
    res.status(422).send({ type: 'Unprocessable request',description: 'Missing/malformed Phone'});
  else if(message.msg == undefined || message.msg == '')
    res.status(422).send({ type: 'Unprocessable request',description: 'Missing/malformed Message'});
  else {
    req.body.phone = req.body.phone.replace(/\D/g,'');
    next();
  }
}


module.exports.deleteMessage = function(req,res,next) {
  var id = req.params.id;
   if(isMessageIdInvalid(id))
    res.status(422).send({ type: 'Unprocessable request', description: 'Missing/malformed msgId'});
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
      res.status(422).send({type: 'Unprocessable request', description: 'Missing/malformed status.'});
    else next();
  }
  else {
    res.status(422).send({type: 'Unprocessable request', description: 'Body is not an Array.'});
  }
}

module.exports.update = function(req,res,next) {
  var message = req.body;
  if(isMessageStatusInvalid(message.status))
    res.status(422).send({ type: 'Unprocessable request', description: 'Missing/malformed status.'});
  else next();
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
    res.status(422).send({ type: 'Unprocessable request',description: 'Missing/malformed msgId'});
  else next();
}
