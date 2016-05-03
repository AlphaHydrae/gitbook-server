var _ = require('lodash'),
    checksum = require('checksum'),
    cp = require('child_process'),
    fs = require('fs-extra'),
    handlebars = require('handlebars'),
    npid = require('npid'),
    p = require('bluebird'),
    shellEscape = require('shell-escape'),
    yaml = require('js-yaml');

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
