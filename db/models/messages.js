/*
* pogui @ tween (6/2015)
* User model funtions.
*/
var ObjectId = require('mongodb').ObjectID;


module.exports.getById = function(id, cb) {
  var collection = db.collection('messages');
  collection.find({'_id': new ObjectId(id)}).toArray(function(err, items) {
    (items.length > 0)?cb(items[0].token):cb(false);
   });
}