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
  else
  {
    var createPeriod = true;
    for(var i = 0; i < companyMessages.length; i++)
    {
      startDate = moment(companyMessages[i].startDate, "DD/MM/YYYY");
      endDate   = moment(companyMessages[i].endDate, "DD/MM/YYYY");
      if(now.isBetween(startDate, endDate, 'day', '[]')){
        if (companyMessages[i].available < listMessagesCount) {
          return false;
        }
        createPeriod = false;
        break;
      }
    }
    if(createPeriod){
      // If no period match this date, a new one is inserted in the company messages array.
      company.info.messages = createNewPeriod(company.info.messages);
      saveCompanyNewPeriod(company._id, function(){

      })
    }
    return true;
  }
}

function createNewPeriod(companyMessages) {
  //set the same year and month of the sending date
  //set the same start number and end day number of the last period for correlativity
  var lastPeriod  = messagesList.length ? messagesList[messagesList.length - 1] : createMessagesList(companyCreation),
      year        = sendDate.year(),
      month       = sendDate.month(),
      startDate   = moment(lastPeriod.startDate, "DD/MM/YYYY").date(),
      endDate     = moment(lastPeriod.endDate, "DD/MM/YYYY").date();

  var newPeriodStart = moment().year(year).month(month).date(startDate).format("DD/MM/YYYY"),
      newPeriodEnd   = moment().year(year).month(month + 1).date(endDate).format("DD/MM/YYYY");

  //if company type is 2, we set 1000 messages, if is an ONG we set 5000, less the amount of sended messages
  if(companyType === 2)
  {
    totalMessages = 1000 - messagesSended;
  }
  else
  {
    totalMessages = 5000 - messagesSended;
  }
  // if the messagesList doesn't exists, then we create a empty one
  // and push the new period
  messagesList = messagesList || [];
  messagesList.push({startDate: newPeriodStart, endDate: newPeriodEnd, available: totalMessages});

  return messagesList;
}

function createMessagesList(companyCreation)
{
  var creationDate = moment(parseInt(companyCreation)),
      year         = creationDate.year(),
      month        = creationDate.month(),
      startDate    = creationDate.date(),
      endDate      = startDate - 1;

  var newPeriodStart = moment().year(year).month(month).date(startDate).format("DD/MM/YYYY"),
      newPeriodEnd   = moment().year(year).month(month + 1).date(endDate).format("DD/MM/YYYY");

  var messagesList = {startDate: newPeriodStart, endDate: newPeriodEnd};

  return messagesList;
}

function saveCompanyNewPeriod(companyId, cb){
  var apiCompaniesConfig  = config.api.companies,
      endpoint            = "/companies/" + companyId;

  api.performRequest(apiCompaniesConfig.host, apiCompaniesConfig.port, apiCompaniesConfig.version, endpoint, "PUT",
    apiCompaniesConfig.accessToken, {}, function(response)
    {
      if(response._id)
      {
        req.company = response;
        next();
      }
      else
      {
        res.status(201).send({success: false, response: response.response});
      }
    }, apiCompaniesConfig.secure);
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
module.exports.filterListbyFlag       = filterListbyFlag;
