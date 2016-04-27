/**
 * Funciones Helpers para validar parametros en middleWare
 * @method opTranslate
 * @param {} msg
 * @return ConditionalExpression
 */
var codes = require('./country.json'),
    conf  = require('../config');

/**
 * @method checkSMS
 * @param string msg
 * @return ConditionalExpression
 */
module.exports.checkMessage = function(msg){
  return (!msg || typeof msg === "undefined") ? "" : msg.substring(0, 160);
};

module.exports.replaceCampaignHeaders = function(message, headers, user) {
  var totalHeaders = headers.length;

  for(var i = 0; i < totalHeaders; i++)
  {
    message = replaceAll(message, headers[i], user[i]);
  }

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
 * Validate the channel
 * @method mapper
 * @param {} str
 * @param {} type
 * @return Literal
 */
 module.exports.checkChannel = function(channel) {
  return (typeof channel === "undefined" || channel === "") ? conf.app.defaults.channel : channel.toLowerCase();
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
  // si son sms que la app esta enviando como sms capturados, guardamos extras
  var extra = {};

  if(typeof captured.companyId !== "undefined") extra.companyId = captured.companyId;
  if(typeof captured.from    !== "undefined") extra.from = captured.from;
  if(typeof captured.type    !== "undefined") extra.type = captured.type;
  if(typeof captured.created !== "undefined") extra.created = captured.created;
  if(typeof captured.deleted !== "undefined") extra.deleted = captured.deleted;
  if(typeof captured.status  !== "undefined") extra.status = captured.status;

  return extra;
}
