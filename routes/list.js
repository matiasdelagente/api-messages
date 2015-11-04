/**
 * rutas protegidas Send y Request de SMS
 */

var hat  	= require('hat').rack();
var rabbit 	= require('../amqp');
var helper 	= require('../helpers');
var config  = require('./config');
var messagesModel 	= require('../db/models/messages');

module.exports.send = function(req, res, next) {
	var msg_id=hat(60,36);
	res.status(201).send({ status: 'ok',response: 'procesamiento en curso', 'msgListID': msg_id});
	listSender(req, msg_id);
}

module.exports.get = function(req, res, next) {
	messagesModel.getListById(req.params.id,function(list) {
		if(list !== false)
			res.status(200).send(list);
		else
			res.status(204).send({ status: 'ERROR',response: 'message no encontrado'});
	});
}

function listSender(req, msg_id) {
	var i=0;
	var list = req.body;
	var company = req.companyId;
	var username = req.username;

	for(element in list) {
		 var message = {
			user 		: username,
			payload		: helper.checkMessage(list[element].msg),
			channel 	: helper.checkChannel(list[element].channel),
			country 	: list[element].countryCode,
			type		: (list[element].type === undefined)? username: list[element].type,
			ttd			: (list[element].ttd == undefined || parseInt(list[element].ttd) == NaN)? 0:parseInt(list[element].ttd),
			listId 		: msg_id,
			flags		: (list[element].flags === undefined)? config.app.defaults.flags:list[element].flags,
			companyId 	: company

		}
		var code = (list[element].country != undefined)?helper.countryCode(list[element].country):"";
		for(phone in list[element].phones) {
				message.phone	= code+list[element].phones[phone];
				message.msgId  	= msg_id+'-'+i;
				rabbit.send(message);
				i++;
			}
		}
}