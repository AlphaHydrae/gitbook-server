var _ = require('lodash'),
    express = require('express'),
    fs = require('fs-extra'),
    p = require('bluebird'),
    path = require('path'),
    utils = require('./utils');

require('./promisify');

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
    return req.path == baseUrl || req.path.indexOf(baseUrl + '/') == '0';
  });

  if (!book) {
    return res.sendStatus(404);
  }

  staticMiddleware(req, res, next);
}

function start() {

  var data = {},
      pidFile = '/var/run/gitbook-server.pid';

  staticMiddleware = express.static('/gitbooks-dist');

  process.on('exit', function() {
    utils.removePid(pidFile);
  });

  process.on('SIGINT', function() {
    process.exit();
  });

  process.on('uncaughtException', function() {
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
  });

  function reloadConfig() {
    if (reloading) {
      console.log('Configuration is already being reloaded');
      return false;
    }

    reload = false;
    reloading = true;

    console.log('Reloading configuration...');

    return p.resolve()
      .then(readConfig)
      .then(initBooks)
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
      data.config.bin = path.resolve(path.join('..', 'bin', 'gitbook-server'));
    });
  }

  function initBooks() {
    return p.all(_.map(data.config.books, function(book) {
      return initBook(book, data.config);
    }));
  }
}

function initBook(book, config) {

  var postReceiveHook,
      dir = '/gitbooks/' + book.name + '.git',
      distDir = '/gitbooks-dist/' + book.name,
      cacheDir = '/gitbooks-cache/' + book.name;

  return utils.fileExists(dir).then(function(exists) {
    if (exists) {
      console.log('Repository ' + dir + ' already exists');
      return dir;
    } else {
      return p.all([
        initRepository(),
        generatePostReceiveHook()
      ])
        .then(installPostReceiveHook)
        .return(dir);
    }
  });

  function initRepository() {
    return p.all([
      fs.mkdirsAsync(dir),
      fs.mkdirsAsync(distDir),
      fs.mkdirsAsync(cacheDir)
    ]).then(function() {
      return utils.executeCommand('git', 'init', '--bare', { cwd: dir });
    });
  }

  function generatePostReceiveHook() {
    return utils.loadHandlebarsTemplate(__dirname + '/../templates/gitbook-build-post-receive-hook.sh.hbs').then(function(template) {
      return template(config).then(function(result) {
        postReceiveHook = result;
      });
    });
  }

  function installPostReceiveHook() {
    return fs.writeFileAsync(path.join(dir, 'hooks', 'post-receive'), postReceiveHook, { encoding: 'utf-8', mode: 0755 });
  }
}

server.start = start;
module.exports = server;
