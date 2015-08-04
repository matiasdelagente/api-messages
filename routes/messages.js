/**
 * rutas protegidas Send y Request de SMS
 */

var hat  	= require('hat');
var rabbit 	= require('../amqp');
var helper 	= require('../helpers');

module.exports.sendList = function(req, res, next) {
	var msg_id=hat(60,36);
	console.log(msg_id);
	res.status(201).send({ status: 'ok',responce: 'procesamiento en curso', 'msg_list_id': msg_id});
	listSender(req.body, msg_id, req.oauth.bearerToken.clientId);
	};

module.exports.send = function(req, res, next) {
	var msg_id=hat(60,36);
	console.log(msg_id);
	res.json({ status: 'ok',responce: 'mensaje enviado corectamente', 'msg_id': msg_id});
	singleSender(req.body, msg_id, req.oauth.bearerToken.clientId);
	};

function listSender(list, msg_id, username) {
	var i=0;
	for(element in list) {
		var message = {
			user 	: username,
			payload	: helper.checkMessage(list[element].msg),
			channel : helper.checkChannel(list[element].channel),
			areaCode: (list[element].country_iso)?helper.areaCode():"",
			type	: (list[element].type == undefined)? username: list[element].type,
			ttd		: (list[element].ttd == undefined || parseInt(list[element].ttd) == NaN)? 0:parseInt(list[element].ttd),
			listID : msg_id,
			flags	: list[element].flags,
		}
		for(phone in list[element].phones) {
				message.phone	= list[element].phones[phone];
				message.msgID  	= msg_id+'-'+i;
				rabbit.send(message);
				i++;
			}
		}
}

function singleSender(msg, msg_id, username) {
	var message = {
			user 	: username,
			payload	: helper.checkMessage(msg.msg),
			channel : helper.checkChannel(msg.channel),
			areaCode: (msg.country_iso)?helper.areaCode():"",
			type	: (msg.type == undefined)? username: msg.type,
			ttd		: (msg.ttd == undefined || parseInt(msg.ttd) == NaN)? 0:parseInt(msg.ttd),
			flags	: msg.flags,
			phone	: msg.phone,
			msgID  	: msg_id
		}
	rabbit.send(message);
}