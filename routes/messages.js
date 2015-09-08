/**
 * rutas protegidas Send y Request de SMS
 */

var rabbit 			= require('../amqp');
var helper 			= require('../helpers');
var hat  			= require('hat').rack();
var messagesModel 	= require('../db/models/messages');


module.exports.send = function(req, res, next) {
	var msg_id=hat(60,36);
	singleSender(req.body, msg_id, req.user);
	res.status(201).send({ status: 'ok',response: 'mensaje enviado corectamente', 'msgID': msg_id});
	};

module.exports.update = function(req, res, next) {
	rabbit.update({'msgId':req.params.id,'status':req.body.msgStatus});
	res.status(201).send({ status: 'ok',response: 'nuevo estado guardado','newMsgStatus':req.body.msgStatus,'msgID': req.params.id});
	};


module.exports.get = function(req, res, next) {

	res.status(201).send({ status: 'not implemented'});
	};

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