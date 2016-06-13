/*
* Pogui @ tween (6/2015)
* Matias P. Sassi @ tween (6/2015)
* Messages model funtions.
*/
var C   = require("../../helpers/constants"),
    Log = require("log"),
    log = new Log();

function getById(id, cb)
{
  var collection = db.collection("messages");
  collection.find({msgId: id}, {}, {limit:1}).toArray(function(err, items)
  {
    if(err)
    {
      log.error(err);
      cb(false);
    }
    else if(items && items.length > 0)
    {
      var message = items[0];
      message.id  = message._id;
      cb(message);
    }
   });
}

function getListById(id, cb)
{
  var collection = db.collection("messages");
  collection.find({listId: id}).toArray(function(err, items)
  {
    if(err)
    {
      log.error(err);
      cb(false);
    }
    else
    {
      if(items && items.length > 0)
      {
        var list = items[0];
        list.id = list._id;
        cb(list);
      }
      else
      {
        cb(false);
      }
    }
   });
}

function getByCompanyId(options, cb)
{
  var pageNumber  = options.offset > 0 ? ((options.offset-1)*options.limit) : 0,
      perPage     = options.limit,
      collection  = db.collection("messages");

  collection.find({companyId: options.companyId}, {}, {limit: perPage})
    .sort({ $natural: 1 })
    .skip(pageNumber)
    .toArray(function(err, items)
    {
      if(err)
      {
        log.error(err);
        cb(false);
      }
      else
      {
        returnArrayResponse(items, cb);
      }
    });
}

function getByPhone(companyId, options, cb)
{
  var pageNumber  = options.offset > 0 ? ((options.offset-1)*options.limit) : 0,
      perPage     = options.limit,
      collection  = db.collection("messages");
  collection.find({companyId: companyId, phone:options.phone}, {}, {limit: perPage})
    .sort({$natural: 1})
    .skip(pageNumber)
    .toArray(function(err, items)
    {
      if(err)
      {
        log.error(err);
        cb(false);
      }
      else
      {
        returnArrayResponse(items, cb);
      }
    });
}

function getByPhoneWOCaptured(companyId, options, cb)
{
  var pageNumber = options.offset > 0 ? ((options.offset - 1) * options.limit) : 0,
      perPage    = options.limit,
      collection = db.collection("messages");
  collection.find({"companyId": companyId, "phone": options.phone, "flags" : { $ne: [ C.CAPTURED, C.CAPTURED_PUSH ] } }, {}, {limit: perPage})
    .sort({ $natural: 1 })
    .skip(pageNumber)
    .toArray(function(err, items)
    {
      if(err)
      {
        log.error(err);
        cb(false);
      }
      else
      {
        returnArrayResponse(items, cb);
      }
    });
}

function returnArrayResponse(items, cb)
{
  if(items && items.length > 0)
  {
    var messageArr = [];
    for(var i=0; i<items.length; i++)
    {
      //Agregado para excluir mensajes personales
      if(items[i].flags && items[i].flags < C.CAPTURED)
      {
        items[i].id = items[i]._id;
        messageArr.push(items[i]);
      }
      else
      {
        if(items[i].captured && items[i].captured.status && items[i].captured.status !== C.MSG_PERSONAL)
        {
          items[i].id = items[i]._id;
          messageArr.push(items[i]);
        }
      }
    }

    cb(messageArr);
  }
  else
  {
    cb(false);
  }
}

module.exports.getByCompanyId       = getByCompanyId;
module.exports.getById              = getById;
module.exports.getByPhone           = getByPhone;
module.exports.getByPhoneWOCaptured = getByPhoneWOCaptured;
module.exports.getListById          = getListById;