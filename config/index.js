var nodeEnv = process.env.NODE_ENV || 'development';
var config = {
  				development: 	require('./development'),
  				testing: 			require('./testing'),
  				production: 	require('./production')

	};

module.exports = config[nodeEnv];
