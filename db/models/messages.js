/*
* pogui @ tween (6/2015)
* User model funtions.
*/

module.exports.getById = function(id, cb) {
  var collection = db.collection('messages');
  collection.find({msgId: id},{},{limit:1}).toArray(function(err, items) {
    (items.length > 0)?cb(items[0].token):cb(false);
   });
}