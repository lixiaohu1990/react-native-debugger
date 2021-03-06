const { app, BrowserWindow, Menu, shell } = require('electron');
const contextMenu = require('electron-context-menu');
const url = require('url');
const qs = require('querystring');

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

let menu;
let template;
let mainWindow = null;

if (process.env.NODE_ENV === 'development') {
  require('electron-debug')(); // eslint-disable-line global-require
}

contextMenu({
  prepend: () => [{
    label: 'Toggle React DevTools',
    click() {
      mainWindow.webContents.send('toggle-devtools', 'react');
    },
  }, {
    label: 'Toggle Redux DevTools',
    click() {
      mainWindow.webContents.send('toggle-devtools', 'redux');
    },
  }],
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('open-url', (e, path) => {
  const route = url.parse(path);

  if (route.host !== 'set-debugger-loc') return;

  const { host, port } = qs.parse(route.query);
  const payload = JSON.stringify({
    host: host || 'localhost',
    port: Number(port) || 8081,
  });
  if (mainWindow) {
    mainWindow.webContents.send('set-debugger-loc', payload);
  } else {
    process.env.DEBUGGER_SETTING = payload;
  }
});

app.on('ready', () => {
  mainWindow = new BrowserWindow({ width: 1024, height: 750, show: false });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  mainWindow.openDevTools();

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (process.platform === 'darwin') {
    template = [{
      label: 'React Native Debugger',
      submenu: [{
        label: 'About React Native Debugger',
        selector: 'orderFrontStandardAboutPanel:',
      }, {
        type: 'separator',
      }, {
        label: 'Services',
        submenu: [],
      }, {
        type: 'separator',
      }, {
        label: 'Hide',
        accelerator: 'Command+H',
        selector: 'hide:',
      }, {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        selector: 'hideOtherApplications:',
      }, {
        label: 'Show All',
        selector: 'unhideAllApplications:',
      }, {
        type: 'separator',
      }, {
        label: 'Quit',
        accelerator: 'Command+Q',
        click() {
          app.quit();
        },
      }],
    }, {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'Command+Z',
          selector: 'undo:',
        }, {
          label: 'Redo',
          accelerator: 'Shift+Command+Z',
          selector: 'redo:',
        }, {
          type: 'separator',
        }, {
          label: 'Cut',
          accelerator: 'Command+X',
          selector: 'cut:',
        },
        {
          label: 'Copy',
          accelerator: 'Command+C',
          selector: 'copy:',
        },
        {
          label: 'Paste',
          accelerator: 'Command+V',
          selector: 'paste:',
        },
        {
          label: 'Select All',
          accelerator: 'Command+A',
          selector: 'selectAll:',
        },
      ],
    }, {
      label: 'View',
      submenu: [{
        label: 'Reload',
        accelerator: 'Command+R',
        click() {
          mainWindow.webContents.reload();
        },
      }, {
        label: 'Toggle Full Screen',
        accelerator: 'Ctrl+Command+F',
        click() {
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
        },
      }, {
        label: 'Toggle Developer Tools',
        accelerator: 'Alt+Command+I',
        click() {
          mainWindow.toggleDevTools();
        },
      }, {
        label: 'Toggle React DevTools',
        accelerator: 'Alt+Command+J',
        click() {
          mainWindow.webContents.send('toggle-devtools', 'react');
        },
      }, {
        label: 'Toggle Redux DevTools',
        accelerator: 'Alt+Command+K',
        click() {
          mainWindow.webContents.send('toggle-devtools', 'redux');
        },
      }],
    }, {
      label: 'Window',
      submenu: [{
        label: 'Minimize',
        accelerator: 'Command+M',
        selector: 'performMiniaturize:',
      }, {
        label: 'Close',
        accelerator: 'Command+W',
        selector: 'performClose:',
      }, {
        type: 'separator',
      }, {
        label: 'Bring All to Front',
        selector: 'arrangeInFront:',
      }],
    }, {
      label: 'Help',
      submenu: [{
        label: 'Documentation',
        click() {
          shell.openExternal('https://github.com/jhen0409/react-native-debugger#usage');
        },
      }, {
        label: 'Issues',
        click() {
          shell.openExternal('https://github.com/jhen0409/react-native-debugger/issues');
        },
      }],
    }];

    menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
});
