/**
 * Funciones Helpers para validar parametros en middleWare
 * @method opTranslate
 * @param {} msg
 * @return ConditionalExpression
 */
var codes = require('./country.json'),
    conf  = require('../config');


module.exports.checkOp = function(msg) {
  return (conf.clients[msg.user].op_map && conf.clients[msg.user].op_map[msg.op])
         ? conf.clients[msg.user].op_map[msg.op] : 'g';
}

/**
 * Description
 * @method userFrom
 * @param {} user
 * @return ConditionalExpression
 */
module.exports.userFrom = function(user) {
    return (conf.clients[user] && conf.clients[user].from)
           ? conf.clients[user].from : '26100';
}

/**
 * @method checkSMS
 * @param string msg
 * @return ConditionalExpression
 */
module.exports.checkMessage = function(msg){
  return (!msg || msg == undefined) ? "" : msg.substring(0, 160);
};

module.exports.replaceCampaignHeaders = function(message, headers, user) {
  var totalHeaders = headers.length;

  console.log("header message: " + message);
  console.log("user: " + JSON.stringify(user));

  for(var i = 0; i < totalHeaders; i++)
  {
    message = replaceAll(message, headers[i], user[i]);
  }

  console.log("header message: " + message);

  return message;
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

/**
 * Description
 * @method mapper
 * @param {} str
 * @param {} type
 * @return Literal
 */
 module.exports.countryCode = function(sentCode) {
  for(code in codes) {
    if(codes[code].ISO == sentCode) {
      return codes[code].CODE;
    }
  }
  return "";
}

/**
 * Description
 * @method mapper
 * @param {} str
 * @param {} type
 * @return Literal
 */
 module.exports.checkChannel = function(channel) {
  return (channel == undefined || channel == '') ? conf.app.defaults.channel : channel.toLowerCase();
}

/**
 * Description
 * @method timestampType
 * @param {} state
 * @return json
 */
 module.exports.timestampByState = function(newState) {
  var states = {
        '0':'recived',
        '1':'processing',
        '2':'delivered',
        '3':'acknowledged',
        '4':'read',
        '5':'spam'
      };

  for(state in states) {
    if(state == newState)
      return states[state];
  }

  return 'error';
}

/**
 * Description
 * @method timestampType
 * @param {} state
 * @return json
 */
 module.exports.fillCapturedExtras = function(captured) {
  // si son sms que la app esta enviando como sms choreados, guardamos extras
  var extra = {};

  if(captured.companyId !== undefined) extra.companyId = captured.companyId;
  if(captured.from    !== undefined) extra.from = captured.from;
  if(captured.type    !== undefined) extra.type = captured.type;
  if(captured.created !== undefined) extra.created = captured.created;
  if(captured.deleted !== undefined) extra.deleted = captured.deleted;
  if(captured.status  !== undefined) extra.status = captured.status;

  return extra;
}
