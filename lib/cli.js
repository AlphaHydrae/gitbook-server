var _ = require('lodash'),
    config = require('./config'),
    pkg = require('../package'),
    program = require('commander'),
    utils = require('./utils');

module.exports = function(argv) {

  var commands = {
    build: require('./commands/build'),
    start: require('./commands/start')
  };

  utils.configureCliProgram(program);

  program
    .command('book [command]', 'Add, build or remove a gitbook.');

  program
    .command('build [name]')
    .description('Build a git book')
    .action(function(name, options) {
      return config(_.extend(utils.parseCliOptions(program), {
        books: _.compact([ name ])
      })).then(commands.build);
    });

  program
    .command('start')
    .description('Start gitbook-server')
    .option('--pid-file <file>', 'Path to the file where the process ID of the gitbook-server will be stored (defaults to /var/run/gitbook-server.pid).', '/var/run/gitbook-server.pid')
    .action(function(options) {
      return config(utils.parseCliOptions(program, options, 'pidFile')).then(commands.start)
    });

  program.parse(argv);
};
