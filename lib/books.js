var _ = require('lodash'),
    fs = require('fs-extra'),
    p = require('bluebird'),
    path = require('path'),
    utils = require('./utils');

exports.updateBook = function(book, options) {

  var postReceiveHook,
      dir = (options.repos || '/gitbooks') + '/' + book.name + '.git',
      distDir = (options.dist || '/gitbooks-dist') + '/' + book.name,
      cacheDir = (options.caches || '/gitbooks-cache') + '/' + book.name;

  return p.all([
    utils.fileExists(dir),
    generatePostReceiveHook()
  ]).spread(function(exists) {
    if (exists) {
      console.log('Repository ' + dir + ' already exists');
      return installPostReceiveHook(false).return(dir);
    } else {
      return initBook()
        .then(_.partial(installPostReceiveHook, true))
        .return(dir);
    }
  });

  function initBook() {
    return p.all([
      initRepository(),
      fs.mkdirsAsync(distDir),
      fs.mkdirsAsync(cacheDir)
    ]);
  }

  function initRepository() {
    return fs.mkdirsAsync(dir).then(function() {
      return utils.executeCommand('git', 'init', '--bare', { cwd: dir });
    });
  }

  function generatePostReceiveHook() {
    return utils.loadHandlebarsTemplate(__dirname + '/../templates/gitbook-build-post-receive-hook.sh.hbs').then(function(template) {
      postReceiveHook = template(_.extend({}, options, book));
    });
  }

  function installPostReceiveHook(force) {

    var hookPath = path.join(dir, 'hooks', 'post-receive');

    if (force) {
      return writeHook();
    }

    return utils.fileExists(hookPath).then(function(exists) {
      if (!exists) {
        return writeHook();
      }

      return p.all([
        utils.checksum(postReceiveHook),
        utils.checksumFile(hookPath)
      ]).spread(function(sum1, sum2) {
        if (sum1 == sum2) {
          return;
        }

        return writeHook().then(function() {
          console.log('Updated post-receive hook for ' + dir);
        });
      });
    });

    function writeHook() {
      return fs.writeFileAsync(hookPath, postReceiveHook, { encoding: 'utf-8', mode: 0755 });
    }
  }
}
