/**
 * rutas protegidas Send y Request de SMS de Campañas
 */

var hat             = require('hat').rack(),
    rabbit          = require('../amqp'),
    helper          = require('../helpers'),
    config          = require('../config'),
    Log             = require('log'),
    log             = new Log(),
    campaignsModel  = require('../db/models/campaigns');

module.exports.send = function(req, res, next) {
  var campaign = req.body;
  res.status(201).send({success: true, status: 'ok', response: 'campaigns.deliverySuccess'});

  campaignsSender(req, campaign);
}

module.exports.get = function(req, res, next) {
  campaignsModel.getById(req.params.id, function(campaign) {
    if(campaign !== false)
      res.status(200).send({success: true, data: campaign});
    else
      res.status(204).send({success: false, status: 'ERROR', response: 'error.campaigns.notFound'});
  });
}

function campaignsSender(req, campaign) {
  var companyId       = req.companyId,
      username        = req.username,
      campaignType    = typeof campaign.type === "undefined" ? username : campaign.type,
      campaignTTD     = (typeof campaign.ttd === "undefined" || isNaN(parseInt(campaign.ttd))) ? 0 : parseInt(campaign.ttd),
      campaignFlags   = typeof campaign.flags === "undefined" ? config.app.defaults.flags : campaign.flags,
      campaignPayload = helper.checkMessage(campaign.description),
      message         = {},
      user            = {},
      totalUsers      = campaign.users.length;

  // we set the message fields
  message.user      = username;
  message.type      = campaignType;
  message.ttd       = campaignTTD;
  message.listId    = campaign.listId;
  message.flags     = campaignFlags;
  message.companyId = companyId;

  for(var i = 0; i < totalUsers; i++)
  {
    // send a message for every user in the list
    user                = campaign.users[i];
    message.payload     = helper.replaceCampaignHeaders(campaignPayload, campaign.headers, user);
    message.channel     = helper.checkChannel(user.channel);
    message.phone       = user.phone;
    message.msgId       = campaign._id + '000' + i;
    message.campaignId  = campaign._id;

    // publish to the messages queue
    rabbit.send(message, true);
  }
}
