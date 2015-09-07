/**
 * rutas protegidas Send y Request de SMS
 */

var hat  	= require('hat').rack();
var rabbit 	= require('../amqp');
var helper 	= require('../helpers');

module.exports.send = function(req, res, next) {
	var msg_id=hat(60,36);
	res.status(201).send({ status: 'ok',response: 'procesamiento en curso', 'msgListID': msg_id});
	listSender(req.body, msg_id, req.user);
	}

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
			listId 	: msg_id,
			flags	: list[element].flags,
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