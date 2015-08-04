var nodeEnv = process.env.NODE_ENV || 'development';
var config = {
  				development: require('./development'),
  				test: require('./test'),
  				production: require('./production')

	};

module.exports = config[nodeEnv];
