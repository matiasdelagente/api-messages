/*
* pogui @ tween (6/2015)
* Messages model funtions.
*/

module.exports.getById = function(id, cb) {
  var collection = db.collection('messages');
  collection.find({msgId: id}, {}, {limit:1}).toArray(function(err, items) {
    (items.length > 0) ? cb(items[0]) : cb(false);
   });
}

module.exports.getListById = function(id, cb) {
  var collection = db.collection('messages');
  collection.find({listId: id}).toArray(function(err, items) {
    (items.length > 0) ? cb(items) : cb(false);
   });
}

module.exports.getByCompanyId = function(options, cb) {
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

module.exports.getByPhone = function(companyId, options, cb) {
  var pageNumber = options.offset > 0 ? ((options.offset-1)*options.limit) : 0;
  var perPage = options.limit;
  var collection = db.collection('messages');

  collection.find({companyId: companyId, phone:options.phone}, {}, {limit: perPage})
    .sort({$natural: 1})
    .skip(pageNumber)
    .toArray(function(err, items) {
      (items.length > 0) ? cb(items) : cb(false);
    });
}
