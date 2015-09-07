/*
* pogui @ tween (6/2015)
* User model funtions.
*/


module.exports.getMessageById = function(id, cb) {
  var collection = db.collection('users');
 collection.find({'id': id},{},{limit:1}).toArray(function(err, items) {
    (items.length > 0)?cb(items[0].token):cb(false);
   });
}