/**
 * Funciones Helpers para validar parametros en middleWare
 * @method opTranslate
 * @param {} msg
 * @return ConditionalExpression
 */
var codes = require('./country.json'),
    conf  = require('../config'),
    moment = require("moment");

/**
 * @method checkSMS
 * @param string msg
 * @return ConditionalExpression
 */
module.exports.checkMessage = function(msg){
  return (!msg || typeof msg === "undefined") ? "" : msg.substring(0, 160);
};

module.exports.replaceCampaignHeaders = function(message, headers, user) {
  var totalHeaders = headers.length,
      replace       = "";

  for(var i = 0; i < totalHeaders; i++)
  {
    replace = (headers[i] !== "common.phone") ? user[i] : user.phone;
    message = replaceAll(message, headers[i], replace);
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
module.exports.checkChannel = function(channel)
{
  var channel = (typeof channel === "undefined" || channel === "") ? conf.app.defaults.channel : channel.toLowerCase();
  return carrierTranslator(channel);
}

function carrierTranslator(channel)
{
  switch (channel)
  {
    case "1":
    case "p":
    case "P":
    case "personal":
        translated = "p";
        break;
    case "2":
    case "9":
    case "M":
    case "m":
    case "movistar":
        translated = "m";
        break;
    case "3":
    case "37":
    case "C":
    case "c":
    case "claro":
        translated = "c";
        break;
    case "4":
    case "8":
    case "n":
    case "N":
    case "nextel":
        translated = "n";
        break;
    case "5":
    case "i":
    case "I":
    case "infobip":
        translated = "i";
        break;
    case "6":
    case "x":
    case "X":
    case "nexmo":
        translated = "x";
        break;
    case "7":
    case "t":
    case "T":
    case "clickatell":
        translated = "t";
        break;
    case "10":
    case "w":
    case "W":
    case "twilio":
    case "twillio":
        translated = "w";
        break;
    case "g":
    case "G":
    case "todos":
    default:
        translated = "g";
        break;
}
  return translated;
}

/**
 * Description
 * @method timestampType
 * @param {} state
 * @return json
 */
 module.exports.timestampByState = function(newState) {
  var states = {
        '0':'received',
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
};

function checkAvailableMessages(company, listMessagesCount)
{
  var companyMessages = company.info.messages || false,
      now             = moment(),
      startDate,
      endDate;
  if(!companyMessages || !companyMessages.length)
  {
    return true;
  }
  for(var i = 0; i < companyMessages.length; i++)
  {
    startDate = moment(companyMessages[i].startDate, "DD/MM/YYYY");
    endDate   = moment(companyMessages[i].endDate, "DD/MM/YYYY");
    if(now.isBetween(startDate, endDate, 'day', '[]') && companyMessages[i].available < listMessagesCount){
      return false;
    }
  }
  return true;
}

function filterListbyFlag(list, flag) {
  var filteredList = [];

  for (var i = 0; i < list.length; i++) {
    if (list[i].flags === flag) {
      filteredList.push(list[i]);
    }
  }

  return filteredList;
}

module.exports.checkAvailableMessages = checkAvailableMessages;
