module.exports.message = function(req,res,next) {
	var message = req.body;
	if(message.phone == undefined || message.phone == '')
 		res.status(422).send({ type: 'Unprocessable request',description: 'Missing/malformed Phone'});
 	else if(message.msg == undefined || message.msg == '')
 		res.status(422).send({ type: 'Unprocessable request',description: 'Missing/malformed Message'});
 	else if(message.flags == undefined || message.flags == '')
 		res.status(422).send({ type: 'Unprocessable request',description: 'Missing/malformed Flags'});
	else next();
}