var _ = require('lodash'),
    p = require('bluebird');

_.each([ 'fs-extra', 'tmp', 'js-yaml' ], function(lib) {
  p.promisifyAll(require(lib));
});
