var messages = require('./routes/messages');

app.use(app.oauth.errorHandler());

//Envio de avisos (ruta autentificada con oauth2):
router.post('/messages/list', app.oauth.authorise(),messages.sendList);
router.post('/messages', app.oauth.authorise(),middleware.message,messages.send);