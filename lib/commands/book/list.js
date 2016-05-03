var _ = require('lodash'),
    books = require('../../books');

module.exports = function(options) {
  books.readBooksConfig(options).then(function(config) {
    _.each(config.books, function(book) {
      console.log(book.name);
    });
  });
};
