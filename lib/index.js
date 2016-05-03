var _ = require('lodash'),
    utils = require('./utils');

utils.promisify();

exports.cli = require('./cli');

_.each([ 'book', 'build', 'start' ], function(command) {
  exports[command] = require('./commands/' + command);
});
