var messages 	= require('./routes/messages');
var middleware 	= require('./middleware');
var oauth2		= require('./oauth2');

//Envio de avisos (ruta autentificada con oauth2):
router.post('/messages/list', oauth2.authorise,messages.sendList);
router.post('/messages', oauth2.authorise,middleware.message,messages.send);
router.put('/messages/:id', oauth2.authorise,middleware.update,messages.update);