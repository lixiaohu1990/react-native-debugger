const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const chalk = require('chalk');
const injectDevToolsMiddleware = require('./injectDevToolsMiddleware');

const name = 'react-native';

const getModulePath = moduleName =>
  path.join(process.cwd(), 'node_modules', moduleName);

const log = (pass, msg) => {
  const prefix = pass ? chalk.green.bgBlack('PASS') : chalk.red.bgBlack('FAIL');
  const color = pass ? chalk.blue : chalk.red;
  console.log(prefix, color(msg));
};

module.exports = (argv, cb) => {
  const modulePath = getModulePath(argv.desktop ? 'react-native-desktop' : name);

  // Revert injection
  if (argv.revert) {
    const passMiddleware = injectDevToolsMiddleware.revert(modulePath);
    const msg = 'Revert injection of React Native Debugger from React Native packager';
    log(
      passMiddleware,
      msg + (!passMiddleware ? `, the file '${injectDevToolsMiddleware.path}' not found.` : '.')
    );
    return cb(passMiddleware);
  }

  const inject = () => {
    const pass = injectDevToolsMiddleware.inject(modulePath);
    const msg = 'Replace `open debugger-ui with Chrome` to `open React Native Debugger`';
    log(pass, msg + (pass ? '.' : `, the file '${injectDevToolsMiddleware.path}' not found.`));
    cb(pass);
  };

  if (process.platform !== 'darwin') {
    inject();
  } else {
    const cwd = '/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/'; // eslint-disable-line
    const lsregisterPath = 'lsregister';
    if (!fs.existsSync(cwd + lsregisterPath)) return inject();

    cp.exec(`./${lsregisterPath} -dump | grep rndebugger:`, { cwd }, (err, stdout) => {
      if (stdout.length === 0) {
        log(
          false,
          'Cannot find `rndebugger` URI Scheme, ' +
          'maybe not install React Native Debugger? ' +
          '(Please visit https://github.com/jhen0409/react-native-debugger#usage) ' +
          'Or it\'s never started. (Not registered URI Scheme)'
        );
        return cb(false, true);
      }
      inject();
    });
  }
};
