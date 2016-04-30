var _ = require('lodash'),
    inflection = require('inflection'),
    p = require('bluebird'),
    utils = require('./utils');

var optionNames = [ 'repos', 'dist', 'caches' ];

module.exports = function(options) {

  var config = _.clone(options);

  return p.resolve()
    .then(getEnvironmentVariables)
    .then(function(result) {
      _.defaults(config, result);
    })
    .then(loadConfigurationFileVariables)
    .then(function(result) {
      _.defaults(config, result);
    }).return(config);

  function getEnvironmentVariables() {
    return _.reduce(optionNames, function(memo, name) {

      var envName = 'GITBOOK_SERVER_' + name.toUpperCase();
      if (_.has(process.env, envName)) {
        memo[name] = process.env[envName];
      }

      return memo;
    }, {});
  }

  function loadConfigurationFileVariables() {
    return utils.readYaml(config.config || '/etc/gitbook-server/config.yml');
  }
};
