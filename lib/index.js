var _ = require('lodash'),
    cp = require('child_process'),
    fs = require('fs-extra'),
    handlebars = require('handlebars'),
    p = require('bluebird'),
    pkg = require('../package'),
    program = require('commander'),
    yaml = require('js-yaml');

exports.cli = function(argv) {

  program
    .version(pkg.version)
    .option('-p, --peppers', 'Add peppers');

  program
    .command('update')
    .description('Reload the gitbooks configuration')
    .action(update);

  program.parse(argv);
};

function update(options) {

  var config = yaml.safeLoad(fs.readFileSync('/etc/gitbook-server/gitbooks.yml', { encoding: 'utf-8' })),
      template = handlebars.compile(fs.readFileSync(__dirname + '/../templates/nginx-server.conf.hbs', { encoding: 'utf-8' }));

  config.port = config.port || 80;

  fs.removeSync('/etc/nginx/sites-enabled/default');
  fs.writeFileSync('/etc/nginx/sites-enabled/default', template(config), { encoding: 'utf-8' });

  _.each(config.books, initRepo);
}

function initRepo(book) {

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

    var hookTemplate = handlebars.compile(fs.readFileSync(__dirname + '/../templates/gitbook-build-hook.sh.hbs', { encoding: 'utf-8' }));
    fs.writeFileSync(dir + '/hooks/post-receive', hookTemplate(book), { encoding: 'utf-8', mode: 0755 });
  }
}
