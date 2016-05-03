var _ = require('lodash'),
    config = require('./config'),
    pkg = require('../package'),
    program = require('commander');

module.exports = function(argv) {

  var commands = {
    build: require('./build'),
    start: require('./start')
  };

  program
    .version(pkg.version)
    .option('-c, --config <file>', 'Path to the gitbook-server configuration file (defaults to /etc/gitbook-server/config.yml).', '/etc/gitbook-server/config.yml')
    .option('-r, --repos <dir>', 'Path to the directory where gitbook repositories are stored (defaults to /gitbooks).', '/gitbooks')
    .option('-d, --dist <dir>', 'Path to the directory where gitbook builds are stored (defaults to /gitbooks-dist).', '/gitbooks-dist')
    .option('-C, --caches <dir>', 'Path to the directory where gitbook caches are stored (defaults to /gitbooks-cache).', '/gitbooks-cache');

  program
    .command('build [name]')
    .description('Build a git book')
    .action(function(name, options) {
      return config(_.extend(parseBaseOptions(), parseOptions(options), {
        books: _.compact([ name ])
      })).then(commands.build);
    });

  program
    .command('start')
    .description('Start gitbook-server')
    .option('--pid-file <file>', 'Path to the file where the process ID of the gitbook-server will be stored (defaults to /var/run/gitbook-server.pid).', '/var/run/gitbook-server.pid')
    .action(function(options) {
      return config(_.extend(parseBaseOptions(), parseOptions(options, 'pidFile'))).then(commands.start)
    });

  function parseBaseOptions() {
    return parseOptions(program, 'config', 'repos', 'dist', 'caches');
  }

  function parseOptions(source) {
    return _.reduce(Array.prototype.slice.call(arguments, 1), function(memo, name) {
      memo[name] = source[name];
      return memo;
    }, {});
  }

  program.parse(argv);
};
