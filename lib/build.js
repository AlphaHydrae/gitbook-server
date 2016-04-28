var _ = require('lodash'),
    cp = require('child_process'),
    fs = require('fs-extra'),
    p = require('bluebird'),
    path = require('path'),
    shellEscape = require('shell-escape'),
    tmp = require('tmp');

function build(options) {
  return p.all(_.map(options.books, function(name) {
    return buildBook(name, options);
  }));
}

function buildBook(name, options) {

  var data = {
    distDir: path.join(options.dist, name),
    repoDir: path.join(options.repos, name + '.git'),
    cacheDir: path.join(options.caches, name)
  };

  function cloneRepository() {
    var command = shellEscape([ 'git', 'clone', data.repoDir, 'repo' ]);
    return execute(command, { cwd: data.tmpDir });
  }

  function gitbookBuild() {
    var command = shellEscape([ 'gitbook', 'build' ]);
    return execute(command, { cwd: path.join(data.tmpDir, 'repo') });
  }

  function makeTmp() {
    return return tmp.dirAsync({
      mode: 0700,
      unsafeCleanup: true
    }).then(function(path) {
      data.tmpDir = path;
    });
  }

  function moveOldBuildOut() {

    var target = path.join(data.tmpDir, 'old');

    function move() {
      return fs.moveAsync(data.distDir, target);
    }

    return fs.statAsync(data.distDir).then(move, move);
  }

  function moveNewBuildIn() {
    return fs.moveAsync(path.join(data.tmpDir, 'repo', '_book'), data.distDir);
  }

  function linkModulesCache() {
    var modulesCacheDir = path.join(data.cacheDir, 'node_modules');
    return fs.mkdirsAsync(modulesCacheDir).then(function() {
      return fs.symlinkAsync(modulesCacheDir, path.join(data.tmpDir, 'repo', 'node_modules'));
    });
  }

  console.log('Building gitbook ' + name);

  return p.resolve(data)
    .then(makeTmp)
    .then(cloneRepository)
    .then(linkModulesCache)
    .then(gitbookBuild)
    .then(moveOldBuildOut)
    .then(moveNewBuildIn)
    .then(function() {
      console.log('Successfully built gitbook ' + name);
    });
}

function execute(command, options) {
  return new p(function(resolve, reject) {
    cp.exec(command, options, function(err, stdout, stderr) {
      if (err) {
        return reject(err);
      }

      resolve({
        stdout: stdout,
        stderr: stderr
      });
    });
  });
}

module.exports = build;
