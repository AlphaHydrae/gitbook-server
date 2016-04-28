var _ = require('lodash'),
    cp = require('child_process'),
    fs = require('fs-extra'),
    handlebars = require('handlebars'),
    p = require('bluebird'),
    which = require('which'),
    yaml = require('js-yaml');

function update(options) {

  var config = yaml.safeLoad(fs.readFileSync('/etc/gitbook-server/gitbooks.yml', { encoding: 'utf-8' })),
      template = handlebars.compile(fs.readFileSync(__dirname + '/../templates/nginx-server.conf.hbs', { encoding: 'utf-8' }));

  config.port = config.port || 80;

  fs.removeSync('/etc/nginx/sites-enabled/default');
  fs.writeFileSync('/etc/nginx/sites-enabled/default', template(config), { encoding: 'utf-8' });

  which('gitbook-server', function(err, bin) {
    if (err) {
      return console.warn(err);
    }

    _.each(config.books, function(book) {
      initRepo(book, bin);
    });
  });
}

function initRepo(book, bin) {

  var dir = '/gitbooks/' + book.name + '.git',
      distDir = '/gitbooks-dist/' + book.name,
      cacheDir = '/gitbooks-cache/' + book.name;

  try {
    fs.statSync(dir);
  } catch (err) {
    console.log('Initializing repository ' + dir);
    fs.mkdirsSync(dir);
    cp.execSync('git init --bare', { cwd: dir });
    fs.mkdirsSync(cacheDir);
    fs.mkdirsSync(distDir);
  }

  var data = _.extend(book, {
    bin: bin
  });

  var hookTemplate = handlebars.compile(fs.readFileSync(__dirname + '/../templates/gitbook-build-post-receive-hook.sh.hbs', { encoding: 'utf-8' }));
  fs.writeFileSync(dir + '/hooks/post-receive', hookTemplate(data), { encoding: 'utf-8', mode: 0755 });
}

module.exports = update;
