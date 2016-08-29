var nodeEnv = process.env.NODE_ENV || 'development';
var config = {
    development:  require('./development'),
    testing:      require('./testing'),
    staging:      require('./staging'),
    production:   require('./production')
  };

module.exports = config[nodeEnv];
