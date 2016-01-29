var messages    = require('./routes/messages'),
    list        = require('./routes/list'),
    middleware  = require('./middleware'),
    oauth2      = require('./oauth2');

//POST
router.post('/messages/list', oauth2.authorise, list.send);
router.post('/messages', oauth2.authorise, middleware.message, messages.send);

//PUT
router.put('/messages/:id', oauth2.authorise,middleware.update, messages.update);

//GET
router.get('/messages/list/:id', oauth2.authorise,list.get);
router.get('/messages/:id', oauth2.authorise, middleware.get, messages.get);
router.get('/messages', oauth2.authorise, messages.getByCompanyId);
router.get('/messages/companies/:companyId', oauth2.authorise, messages.getByPhone)

//DELETE
router.delete('/messages/:id', oauth2.authorise, messages.delete);
