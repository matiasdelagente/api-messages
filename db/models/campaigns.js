/*
* Matias P. Sassi (03/2016)
* Campaigns model funtions.
*/
var ObjectId = require('mongodb').ObjectID;

module.exports.getById = function(id, cb) {
  var collection = db.collection('campaigns');
  collection.findOne({_id: new ObjectId(id)}, {}, {limit:1}).toArray(function(err, campaign) {
    (campaign) ? cb(campaign) : cb(false);
   });
}