var _ = require('lodash');

require('./promisify');

_.each([ 'cli', 'build', 'start' ], function(command) {
  exports[command] = require('./' + command);
});
