'use strict';

const fs = require('fs');
const path = require('path');

const name = 'react-native-debugger-patch';
const startFlag = `/* ${name} start */`;
const endFlag = `/* ${name} end */`;
const keyFunc = 'launchChromeDevTools';
const funcFlag = `function ${keyFunc}(port) {`;
const replaceFuncFlag = `function ${keyFunc}(port, skipRNDebugger) {`;

exports.dir = 'local-cli/server/middleware';
exports.file = 'getDevToolsMiddleware.js';
exports.path = path.join(exports.dir, exports.file);

exports.inject = modulePath => {
  const filePath = path.join(modulePath, exports.path);
  if (!fs.existsSync(filePath)) return false;

  const code = [
    startFlag,
    'var _rndebuggerIsOpening = false;',
    replaceFuncFlag,
    '  if (process.platform === "darwin" && !skipRNDebugger) {',
    '    if (_rndebuggerIsOpening) return;',
    '    _rndebuggerIsOpening = true;',
    '    opn("rndebugger://set-debugger-loc?host=localhost&port=" + port, { wait: false }, err => {',
    '      if (err) {',
    '        console.log(',
    '          "\\nCannot open React Native Debugger, maybe not install?\\n" +',
    '          "(Please visit https://github.com/jhen0409/react-native-debugger#usage)\\n" +',
    '          "Or it\'s never started. (Not registered URI Scheme)\\n"',
    '        );',
    `        ${keyFunc}(port, true);`,
    '      }',
    '      _rndebuggerIsOpening = false;',
    '    });',
    '    return;',
    '  }',
    endFlag,
  ].join('\n');

  const middlewareCode = fs.readFileSync(filePath, 'utf-8');
  let start = middlewareCode.indexOf(startFlag);  // already injected ?
  let end = middlewareCode.indexOf(endFlag) + endFlag.length;
  if (start === -1) {
    start = middlewareCode.indexOf(funcFlag);
    end = start + funcFlag.length;
  }
  fs.writeFileSync(
    filePath,
    middlewareCode.substr(0, start) + code + middlewareCode.substr(end, middlewareCode.length)
  );
  return true;
};

exports.revert = modulePath => {
  const filePath = path.join(modulePath, exports.path);
  if (!fs.existsSync(filePath)) return false;

  const middlewareCode = fs.readFileSync(filePath, 'utf-8');
  const start = middlewareCode.indexOf(startFlag); // already injected ?
  const end = middlewareCode.indexOf(endFlag) + endFlag.length;
  if (start !== -1) {
    fs.writeFileSync(
      filePath,
      middlewareCode.substr(0, start) + funcFlag + middlewareCode.substr(end, middlewareCode.length)
    );
  }
  return true;
};
