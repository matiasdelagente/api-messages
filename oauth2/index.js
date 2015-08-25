module.exports.initialize = function() {
	var MongoClient = require('mongodb').MongoClient;
	MongoClient.connect(config.oauth2, function(err, database) {
  		if(err) throw err;
  		db = database;
  		collection = db.collection('oauth_accesstokens');
  		log.info("Oauth2 initialized ".yellow);  
	});
}

module.exports.authorise = function(req,res,next) {
	// Header: http://tools.ietf.org/html/rfc6750#section-2.1
	var headerToken = req.get('Authorization');
	if (headerToken) {
		var matches = headerToken.match(/Bearer\s(\S+)/);
    	if (!matches) {
			res.status(499).send({ status: 'token_required',responce: 'no token was submitted.'});
    	}
    headerToken = matches[1];
    req.bearerToken = headerToken;

	checkToken(req,res,function(){
		next();
	});
  }
  else
 		res.status(417).send({ status: 'expectation_failed',responce: 'Expected request-header fail.'});

}

/**
 * Check token
 *
 * Check it against model, ensure it's not expired
 * @param  {Object} req
 * @param {Function} done
 * @this   OAuth
 */
function checkToken (req,res,done) {
  	collection.find({"accessToken": req.bearerToken},{},{limit:1}).toArray(function(err, token) {

    if (err)
    	res.status(503).send({ status: 'service_unavailable',responce: 'Sorry, try latter.'});

console.log(token);
    if (!token[0])
      res.status(499).send({ status: 'invalid_token',responce: 'The access token provided is invalid.'});
	
    if (token[0].expires !== null && (!token[0].expires || token[0].expires < new Date())) {
            res.status(498).send({ status: 'invalid_token',responce: 'The access token provided has expired.'});

    }
    else {
    	// Expose params
    	req.oauth2 = { bearerToken: token[0] };
    	req.user = token[0].user ? token[0].user : { id: token[0].userId };
    	done();
		}
	});
}