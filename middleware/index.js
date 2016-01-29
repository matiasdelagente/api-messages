var validator = require("validator");

module.exports.message = function(req,res,next) {
	var message = req.body;
	if(message.phone == undefined || message.phone == '' || !validator.isDecimal(message.phone) || message.phone.length >= 20)
 		res.status(422).send({ type: 'Unprocessable request',description: 'Missing/malformed Phone'});
 	else if(message.msg == undefined || message.msg == '')
 		res.status(422).send({ type: 'Unprocessable request',description: 'Missing/malformed Message'});
	else {
			req.body.phone = req.body.phone.replace(/\D/g,'');
			req.body.channel = req.body.channel.toLowerCase();
			next();
	}
}

module.exports.update = function(req,res,next) {
	var message = req.body;
	if(message.status == undefined || Math.abs(message.status) > 5)
 		res.status(422).send({ type: 'Unprocessable request', description: 'Missing/malformed status'});
	else next();
}

module.exports.get = function(req,res,next) {
	var id = req.params.id;
	if(!(id.length >= 32) || !validator.isAlphanumeric(id))
 		res.status(422).send({ type: 'Unprocessable request',description: 'Missing/malformed msgId'});
	else next();
}
