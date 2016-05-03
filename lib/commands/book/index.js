var _ = require('lodash'),
    config = require('../../config'),
    pkg = require('../../../package'),
    program = require('commander'),
    utils = require('../../utils');

utils.promisify();

exports.cli = function(argv) {

  var commands = {
    list: require('./list')
  };

  utils.configureCliProgram(program);

  program
    .command('list')
    .description('List configured gitbooks.')
    .action(function(options) {
      return config(utils.parseCliOptions(program)).then(commands.list);
    });

  program.parse(argv);
};
