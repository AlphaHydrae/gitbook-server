var _ = require('lodash'),
    pkg = require('../package'),
    program = require('commander');

require('./promisify');

_.each([ 'build', 'update' ], function(command) {
  exports[command] = require('./' + command);
});

exports.cli = function(argv) {

  program
    .version(pkg.version)
    .option('-r, --repos <dir>', 'Path to the directory where gitbook repositories are stored (defaults to /gitbooks).', '/gitbooks')
    .option('-d, --dist <dir>', 'Path to the directory where gitbook builds are stored (defaults to /gitbooks-dist).', '/gitbooks-dist')
    .option('-c, --caches <dir>', 'Path to the directory where gitbook caches are stored (defaults to /gitbooks-cache).', '/gitbooks-cache');

  program
    .command('build [name]')
    .description('Build a git book')
    .action(function(name, options) {
      return exports.build(_.extend(parseBaseOptions(), parseOptions(options), {
        books: _.compact([ name ])
      }));
    });

  program
    .command('update')
    .description('Reload and apply the configuration')
    .action(function(options) {
      return exports.update(options);
    })

  function parseBaseOptions() {
    return parseOptions(program, 'repos', 'dist', 'caches');
  }

  function parseOptions(source) {
    return _.reduce(Array.prototype.slice.call(arguments, 1), function(memo, name) {
      memo[name] = source[name];
      return memo;
    }, {});
  }

  program.parse(argv);
};
