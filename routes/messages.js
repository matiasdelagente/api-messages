/**
 * rutas protegidas Send y Request de SMS
 */

var rabbit 			= require('../amqp');
var helper 			= require('../helpers');
var hat  			= require('hat').rack();
var config  		= require('../config');
var C				= require('../helpers/constants');
var messagesModel 	= require('../db/models/messages');



module.exports.send = function(req, res, next) {
	var msg_id=hat(60,36);
	singleSender(req, msg_id, req.companyId);
	res.status(201).send({response: 'mensaje enviado corectamente', 'msgId': msg_id});
}

module.exports.update = function(req, res, next) {
	//build the update object
	var updateMsg = {'msgId':req.params.id,'status':req.body.status, timestamp: {}};
	//add the timestamp to the update object by state number
	updateMsg.timestamp[helper.timestampByState(req.body.status)] = new Date().getTime();
	//send the update object to rabbitmq
	rabbit.update(updateMsg);
	//finally send the http response
	res.status(201).send({response: 'nuevo estado guardado','status':req.body.status,'msgId': req.params.id});
}

module.exports.get = function(req, res, next) {
	messagesModel.getById(req.params.id,function(msg) {
		if(msg !== false)
			res.status(200).send(msg);
		else
			res.status(204).send({ status: 'ERROR',response: 'message no encontrado'});
	});
}

function singleSender(req, msg_id) {
	var msg = req.body;
	var company = req.companyId;
	var username = req.username;

	var code = (msg.countryCode != undefined)?helper.countryCode(msg.countryCode):"";
	var message = {
			payload		: helper.checkMessage(msg.msg),
			channel 	: helper.checkChannel(msg.channel),
			country		: (msg.countryCode != undefined)?msg.countryCode:"",
			type		: (msg.type === undefined)? username: msg.type,
			ttd			: (msg.ttd === undefined || parseInt(msg.ttd) == NaN)? 0:parseInt(msg.ttd),
			flags		: (msg.flags === undefined)? config.app.defaults.flags:msg.flags,
			phone		: code+msg.phone,
			msgId  		: msg_id,
			companyId 	: company
		}

		// si son sms que la app esta enviando como sms choreados, guardamos extras
		if(msg.flags == C.CAPTURED) message.captured=helper.fillCapturedExtras(msg);

		rabbit.send(message);
}