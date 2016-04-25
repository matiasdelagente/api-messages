/*
* pogui @ tween (6/2015)
* Messages model funtions.
*/
var C = require('../../helpers/constants');

function getById(id, cb) {
  var collection = db.collection('messages');
  collection.find({msgId: id}, {}, {limit:1}).toArray(function(err, items) {
    (items.length > 0) ? cb(items[0]) : cb(false);
   });
}

function getListById(id, cb) {
  var collection = db.collection('messages');
  collection.find({listId: id}).toArray(function(err, items) {
    (items.length > 0) ? cb(items) : cb(false);
   });
}

function getByCompanyId(options, cb) {
  var pageNumber = options.offset > 0 ? ((options.offset-1)*options.limit) : 0;
  var perPage = options.limit;
  var collection = db.collection('messages');

  collection.find({companyId: options.companyId}, {}, {limit: perPage})
    .sort({ $natural: 1 })
    .skip(pageNumber)
    .toArray(function(err, items) {
      (items.length > 0) ? cb(items) : cb(false);
    });
}

function getByPhone(companyId, options, cb) {
  var pageNumber = options.offset > 0 ? ((options.offset-1)*options.limit) : 0;
  var perPage = options.limit;
  var collection = db.collection("messages");
  collection.find({companyId: companyId, phone:options.phone}, {}, {limit: perPage})
    .sort({$natural: 1})
    .skip(pageNumber)
    .toArray(function(err, items) {
      (items.length > 0) ? cb(items) : cb(false);
    });
}

function getByPhoneWOCaptured(companyId, options, cb) {
  var pageNumber = options.offset > 0 ? ((options.offset-1)*options.limit) : 0;
  var perPage = options.limit;
  var collection = db.collection("messages");
  collection.find(
    {companyId: companyId, phone:options.phone, flag : { $ne: [ C.CAPTURED, C.CAPTURED_PUSH ] } },
    {}, {limit: perPage})
    .sort({ $natural: 1 })
    .skip(pageNumber)
    .toArray(function(err, items) {
      if(items && items.length > 0){
        cb(items);
      }else{
        cb(false);
      }
    });
}

module.exports.getByCompanyId       = getByCompanyId;
module.exports.getById              = getById;
module.exports.getByPhone           = getByPhone;
module.exports.getByPhoneWOCaptured = getByPhoneWOCaptured;
module.exports.getListById          = getListById;
