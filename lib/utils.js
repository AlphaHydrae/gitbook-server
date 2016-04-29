var fs = require('fs-extra'),
    handlebars = require('handlebars'),
    yaml = require('js-yaml');

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
