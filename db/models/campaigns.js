/*
* Matias P. Sassi (03/2016)
* Campaigns model funtions.
*/
var ObjectId = require('mongodb').ObjectID,
    Log      = require('log'),
    log      = new Log();

module.exports.getById = function(id, cb) {
  var collection = db.collection('campaigns');
  collection.findOne({_id: id},{}, {limit:1}).toArray(function(err, items) {
    (items.length > 0) ? cb(items[0]):cb(false);
   });
}



