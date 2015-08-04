/**
 * Funciones Helpers para validar parametros en middleWare
 * @method opTranslate
 * @param {} msg
 * @return ConditionalExpression
 */
codes = require('./country.json');

module.exports.checkOp = function(msg) {

	return (conf.clients[msg.user].op_map && conf.clients[msg.user].op_map[msg.op]) ? conf.clients[msg.user].op_map[msg.op]: 'g';
}

/**
 * Description
 * @method userFrom
 * @param {} user
 * @return ConditionalExpression
 */
module.exports.userFrom = function(user) {
    return (conf.clients[user] && conf.clients[user].from) ? conf.clients[user].from : '26100';
}

/**
 * @method checkSMS
 * @param {} sms
 * @return ConditionalExpression
 */
module.exports.checkMessage = function(sms){
	var text;
	(!sms || sms == undefined)?  text = "" : text = sms.substring(0, 160);
	return text;
};

/**
 * Description
 * @method mapper
 * @param {} str
 * @param {} type
 * @return Literal
 */
 module.exports.countryCode = function(country) {
	

	return "";
};

/**
 * Description
 * @method mapper
 * @param {} str
 * @param {} type
 * @return Literal
 */
 module.exports.checkChannel = function(channel) {
	return channel;
};