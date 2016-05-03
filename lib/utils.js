var _ = require('lodash'),
    checksum = require('checksum'),
    cp = require('child_process'),
    fs = require('fs-extra'),
    handlebars = require('handlebars'),
    npid = require('npid'),
    p = require('bluebird'),
    pkg = require('../package'),
    shellEscape = require('shell-escape'),
    tmp = require('tmp'),
    yaml = require('js-yaml');

exports.promisify = function() {
  _.each([ fs, tmp, yaml ], function(lib) {
    p.promisifyAll(lib);
  });
};

exports.savePid = function(file) {
  return new p(function(resolve, reject) {
    try {
      var pid = npid.create(file);
      pid.removeOnExit();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

exports.removePid = function(file) {
  npid.remove(file);
};

exports.readYaml = function(file) {
  return fs.readFileAsync(file, { encoding: 'utf-8' }).then(function(contents) {
    return yaml.safeLoad(contents);
  });
};

exports.loadHandlebarsTemplate = function(file) {
  return fs.readFileAsync(file, { encoding: 'utf-8' }).then(function(contents) {
    return handlebars.compile(contents);
  });
};

exports.executeCommand = function() {

  var args = Array.prototype.slice.call(arguments);

  return new p(function(resolve, reject) {

    var options = {};
    if (_.isObject(args[args.length - 1])) {
      options = args.pop();
    }

    var command = shellEscape(args);

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
};

exports.fileExists = function(file) {
  return fs.statAsync(file).then(function() {
    return true;
  }, function() {
    return false;
  });
};

exports.checksum = function(contents) {
  return p.resolve(checksum(contents));
};

exports.checksumFile = function(file) {
  return new p(function(resolve, reject) {
    checksum.file(file, function(err, sum) {
      if (err) {
        reject(err);
      } else {
        resolve(sum);
      }
    });
  });
};

exports.configureCliProgram = function(program) {
  program
    .version(pkg.version)
    .option('-c, --config <file>', 'Path to the gitbook-server configuration file (defaults to /etc/gitbook-server/config.yml).', '/etc/gitbook-server/config.yml')
    .option('-b, --gitbooks <file>', 'Path to the gitbooks configuration file (default to /etc/gitbook-server/gitbooks.yml).', '/etc/gitbook-server/gitbooks.yml')
    .option('-r, --repos <dir>', 'Path to the directory where gitbook repositories are stored (defaults to /gitbooks).', '/gitbooks')
    .option('-d, --dist <dir>', 'Path to the directory where gitbook builds are stored (defaults to /gitbooks-dist).', '/gitbooks-dist')
    .option('-C, --caches <dir>', 'Path to the directory where gitbook caches are stored (defaults to /gitbooks-cache).', '/gitbooks-cache');
};

exports.parseCliOptions = function(program, options) {
  return _.extend(
    _.pick(program, 'config', 'gitbooks', 'repos', 'dist', 'caches'),
    _.pick.apply(_, [ options ].concat(Array.prototype.slice.call(arguments, 2)))
  );
};
