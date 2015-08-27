/**
 * rutas protegidas Send y Request de SMS
 */

var hat  	= require('hat').rack();
var rabbit 	= require('../amqp');
var helper 	= require('../helpers');

module.exports.sendList = function(req, res, next) {
	var msg_id=hat(60,36);
	res.status(201).send({ status: 'ok',response: 'procesamiento en curso', 'msgListID': msg_id});
	listSender(req.body, msg_id, req.user);
	};

module.exports.send = function(req, res, next) {
	var msg_id=hat(60,36);
	singleSender(req.body, msg_id, req.user);
	res.status(201).send({ status: 'ok',response: 'mensaje enviado corectamente', 'msgID': msg_id});
	};

module.exports.update = function(req, res, next) {
	rabbit.update({'msgID':req.params.id,'status':req.body.msgStatus});
	res.status(201).send({ status: 'ok',response: 'nuevo estado guardado','newMsgStatus':req.body.msgStatus,'msgID': req.params.id});
	};

function listSender(list, msg_id, username) {
	var i=0;
	for(element in list) {
		 var message = {
			user 	: username,
			payload	: helper.checkMessage(list[element].msg),
			channel : helper.checkChannel(list[element].channel),
			country : list[element].countryCode,
			type	: (list[element].type == undefined)? username: list[element].type,
			ttd		: (list[element].ttd == undefined || parseInt(list[element].ttd) == NaN)? 0:parseInt(list[element].ttd),
			listID 	: msg_id,
			flags	: list[element].flags,
		}
		var code = (list[element].country != undefined)?helper.countryCode(list[element].country):"";
		for(phone in list[element].phones) {
				message.phone	= code+list[element].phones[phone];
				message.msgID  	= msg_id+'-'+i;
				rabbit.send(message);
				i++;
			}
		}
}

function singleSender(msg, msg_id, username) {
	var code = (msg.country != undefined)?helper.countryCode(msg.country):"";
	var message = {
			user 	: username,
			payload	: helper.checkMessage(msg.msg),
			channel : helper.checkChannel(msg.channel),
			areaCode: (msg.country != undefined)?helper.areaCode(msg.country):"",
			type	: (msg.type == undefined)? username: msg.type,
			ttd		: (msg.ttd == undefined || parseInt(msg.ttd) == NaN)? 0:parseInt(msg.ttd),
			flags	: msg.flags,
			phone	: code+msg.phone,
			msgID  	: msg_id
		}
		rabbit.send(message);
}