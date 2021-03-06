module.exports = function (router)
{
  var messages    = require("./routes/messages"),
      list        = require("./routes/list"),
      campaigns   = require("./routes/campaigns"),
      middleware  = require("./middleware"),
      callbacks   = require("./routes/callbacks"),
      oauth2      = require("./oauth2");

  //POST
  router.post("/messages/lists", oauth2.authorise, middleware.sendMessagesList, middleware.checkCompany, middleware.checkCompanyBillingStatus, list.send);
  router.post("/messages/list", oauth2.authorise, middleware.sendMessagesList, list.send); //momentaneo hasta que todos usen la de arriba
  router.post("/messages/campaigns", oauth2.authorise, campaigns.send);
  router.post("/messages", oauth2.authorise, middleware.message, messages.send);

  //PUT
  router.put("/messages/:id", oauth2.authorise, middleware.update, messages.update);
  router.put("/messages", oauth2.authorise, middleware.updateCollection, messages.updateCollection);

  //GET
  router.get("/messages/lists/:id", oauth2.authorise, list.get);
  router.get("/messages/:id", oauth2.authorise, middleware.get, messages.get);
  router.get("/messages", oauth2.authorise, messages.getByCompanyId);
  router.get("/messages/companies/:companyId", oauth2.authorise, messages.getByPhone);
  router.get("/messages/companies/:companyId/notfull", oauth2.authorise, messages.getByPhoneWOCaptured);

  //DELETE
  router.delete("/messages/:id", oauth2.authorise, middleware.deleteMessage, messages.delete);

  // CALLBACKS
  router.post("/messages/callbacks/infobip", middleware.infobip, callbacks.infobip);
  router.post("/messages/callbacks/clickatell", middleware.clickatell, callbacks.clickatell);
  router.get("/messages/callbacks/nexmo", middleware.nexmo, callbacks.nexmo);
};
