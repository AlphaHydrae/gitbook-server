var _ = require('lodash'),
    fs = require('fs-extra'),
    p = require('bluebird'),
    path = require('path'),
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
    }).then(function() {
      _.extend(config, {
        bin: path.resolve(path.join(__dirname, '..', 'bin', 'gitbook-server'))
      });

      console.log(config);
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

    var file = config.config || '/etc/gitbook-server/config.yml';

    return fs.statAsync(file).then(function() {
      return utils.readYaml(file);
    }).catch(function() {
      return {};
    });
  }
};
