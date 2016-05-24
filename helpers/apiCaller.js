"use strict";

var querystring = require('querystring'),
    Log         = require('log'),
    https       = require('https'),
    http        = require('http'),
    log         = new Log(),
    colors      = require('colors');

module.exports.performRequest = function (host, port, version, endpoint, method, token, data, success, secure) {
  secure = secure || false;

  var headers = {};
  if(token && token.length !== 0)
  {
    headers["Authorization"] = "Bearer " + token;
  }
  var dataString = '';

  if (method === 'GET') {
    dataString = querystring.stringify(data);
    if (data) endpoint += '?' + dataString;
  } else {
    dataString = JSON.stringify(data);
    //FIXME: This should use an API key instead of a hardcoded access token
    headers["Content-Type"]   = "application/json";
    headers["Content-Length"] = Buffer.byteLength(dataString);
  }

  log.info((secure ? "Secure API call" : "Insecure API call") + " to: ["
            + method.toUpperCase() + "] " + host + ":" + port + version + endpoint);

  var options = {
    host   : host,
    port   : port,
    path   : version + endpoint,
    method : method,
    headers: headers
  };

  try {
    makeRequest(options, dataString, success, secure);
  } catch (e) {
    log.error(e);
  }
};

function makeRequest(options, dataString, success, secure){
  secure = secure || false;
  var req;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  if(secure)
  {
    options.strictSSL = true;
    options.protocol = "https:";
    req = https.request(options, function (res) {
      processResponse(res, success);
    });
  }
  else
  {
    req = http.request(options, function (res) {
      processResponse(res, success);
    });
  }

  req.on('error', function (e) {
    log.log(e);
    log.log('Problem with request: ' + e.message);
  });

  if (options.method === 'POST' || options.method === 'PUT' || options.method === "DELETE")
  {
    req.write(dataString);
  }
  req.end();
}

function processResponse(res, success) {
  var body = '';
  res.setEncoding('utf8');

  res.on("data", function (chunk) {
    body += chunk;
  });

  res.on("end", function () {
    try {
      success(JSON.parse(body));
    } catch (e) {
      success(false);
      log.error("ERROR api call: " + e.message);
    }
  });
}
