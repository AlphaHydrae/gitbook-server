var bodyParser = require('body-parser'),
    express = require('express'),
    logger = require('morgan'),
    http = require('http'),
    p = require('bluebird');

module.exports = function(gitbookServerMiddleware) {

  var app = express(),
      server = http.createServer(app);

  app.use(logger('dev'));
  app.use(bodyParser.json());

  app.use(gitbookServerMiddleware);

  app.use(function(req, res) {
    res.sendStatus(404);
  });

  app.use(function(err, req, res, next) {

    var payload = {
      message: err.message
    };

    if (true) {
      payload.stack = err.stack;
    }

    res.render(payload);
  });

  /**
   * Get port from environment and store in Express.
   */
  var port = normalizePort(process.env.PORT || '80');
  app.set('port', port);

  return startServer();

  function startServer() {
    return new p(function(resolve, reject) {

      /**
       * Listen on provided port, on all network interfaces.
       */
      server.listen(port);
      server.on('error', onError);
      server.on('listening', onListening);

      /**
       * Event listener for HTTP server "error" event.
       */
      function onError(error) {
        if (error.syscall !== 'listen') {
          return reject(error);
        }

        var bind = typeof port === 'string'
          ? 'Pipe ' + port
          : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
          case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            reject(new Error(bind + ' requires elevated privileges'));
            break;
          case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            reject(new Error(bind + ' is already in use'));
            break;
          default:
            reject(error);
        }
      }

      /**
       * Event listener for HTTP server "listening" event.
       */
      function onListening() {

        var addr = server.address();
        var bind = typeof addr === 'string'
          ? 'pipe ' + addr
          : 'port ' + addr.port;

        console.log('Listening on ' + bind);
        resolve();
      }
    });
  }

  /**
   * Normalize a port into a number, string, or false.
   */
  function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
      // named pipe
      return val;
    }

    if (port >= 0) {
      // port number
      return port;
    }

    return false;
  }
}
