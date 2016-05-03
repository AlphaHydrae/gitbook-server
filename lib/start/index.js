var _ = require('lodash'),
    books = require('../books'),
    express = require('express'),
    expressApp = require('./express'),
    p = require('bluebird'),
    path = require('path'),
    utils = require('../utils');

var config,
    staticMiddleware,
    reload = false,
    reloading = false;

function server(req, res, next) {
  if (!config) {
    return res.sendStatus(404);
  }

  var book = _.find(config.books, function(book) {
    var baseUrl = '/' + book.name;
    return req.path == baseUrl || req.path.indexOf(baseUrl + '/') === 0;
  });

  if (!book) {
    return res.sendStatus(404);
  }

  staticMiddleware(req, res, next);
}

function start(options) {

  var data = {},
      pidFile = options.pidFile || '/var/run/gitbook-server.pid';

  staticMiddleware = express.static(options.dist || '/gitbooks-dist');

  process.on('exit', function() {
    console.log('Removing PID on exit');
    utils.removePid(pidFile);
  });

  process.on('SIGQUIT', function() {
    console.log('Received SIGQUIT');
    process.exit();
  });

  process.on('SIGTERM', function() {
    console.log('Received SIGTERM');
    process.exit();
  });

  process.on('SIGINT', function() {
    console.log('Received SIGINT');
    process.exit();
  });

  process.on('uncaughtException', function() {
    console.log('Received uncaught exception');
    process.exit();
  });

  process.on('SIGHUP', function() {
    console.log('Received SIGHUP');

    reload = true;

    reloadConfig().then(function() {
      if (reload) {
        reloadConfig();
      }
    });
  });

  return utils.savePid(pidFile).then(function() {
    reload = true;
    return reloadConfig();
  }).then(function() {
    return expressApp(server);
  });

  function reloadConfig() {
    if (reloading) {
      console.log('Configuration is already being reloaded');
      return false;
    }

    reload = false;
    reloading = true;

    if (!config) {
      console.log('Loading configuration...');
    } else {
      console.log('Reloading configuration...');
    }

    return p.resolve()
      .then(readConfig)
      .then(updateBooks)
      .then(function() {
        console.log('Configuration successfully loaded and applied');
        return true;
      })
      .finally(function() {
        reloading = false;
      });
  }

  function readConfig() {
    return utils.readYaml('/etc/gitbook-server/gitbooks.yml').then(function(loadedConfig) {
      config = loadedConfig;
      data.config = loadedConfig;
    });
  }

  function updateBooks() {
    return p.all(_.map(data.config.books, function(book) {
      return books.updateBook(book, options);
    }));
  }
}

module.exports = start;
