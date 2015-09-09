/**
 * rutas protegidas Send y Request de SMS
 */

var rabbit 			= require('../amqp');
var helper 			= require('../helpers');
var hat  			= require('hat').rack();
var messagesModel 	= require('../db/models/messages');


module.exports.send = function(req, res, next) {
	var msg_id=hat(60,36);
	console.log("single sender");
	singleSender(req.body, msg_id, req.user);
	res.status(201).send({response: 'mensaje enviado corectamente', 'msgId': msg_id});
}

module.exports.update = function(req, res, next) {
	rabbit.update({'msgId':req.params.id,'status':req.body.status});
	res.status(201).send({response: 'nuevo estado guardado','status':req.body.status,'msgId': req.params.id});
}


module.exports.get = function(req, res, next) {
	messagesModel.getById(req.params.id,function(user) {
		if(user !== false)
			res.status(200).send(user);
		else
			res.status(204).send({ status: 'ERROR',response: 'message no encontrado'});
		});
}

function singleSender(msg, msg_id, username) {
	var code = (msg.country != undefined)?helper.countryCode(msg.country):"";
	var message = {
			user 		: username,
			payload		: helper.checkMessage(msg.msg),
			channel 	: helper.checkChannel(msg.channel),
			areaCode	: (msg.country != undefined)?helper.areaCode(msg.country):"",
			type		: (msg.type == undefined)? username: msg.type,
			ttd			: (msg.ttd == undefined || parseInt(msg.ttd) == NaN)? 0:parseInt(msg.ttd),
			flags		: msg.flags,
			phone		: code+msg.phone,
			msgId  		: msg_id,
			companyId 	: req.user
		}
		rabbit.send(message);
}