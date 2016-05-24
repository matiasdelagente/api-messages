var MongoClient = require('mongodb').MongoClient;
var conf 		= require('../config');

// Loging setup:
var Log    = require('log'),
    log    = new Log();
    colors = require('colors');

// Connection URL 
var url = 'mongodb://'+conf.db.addr+':'+conf.db.port+'/vcMessages';
// Use connect method to connect to the Server 
MongoClient.connect(url, function(err, database) {
  if(err) throw err;
  db = database;
  log.info("Connected correctly to mongoDB".yellow);
});
