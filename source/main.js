const {
  app,
  ipcMain: ipc,
  BrowserWindow,
  dialog,
  Menu,
  Tray
} = require('electron');
const path = require('path');
const url = require('url');
const DiscordRPC = require('./RPC');
const settings = require('electron-settings');
const ps = require('ps-node');
const fs = require('fs');

let rpc;
let mainWindow;
let tray;

const clientId = '429697664658178059'

let mainLoop;
let updateRate = 1000;

const tf2DRC = {
  isOn: {
    dis: false,
    tf2: false,
  },
  count: {
    dis: 0,
    tf2: 0,
  },
  tf2Exec: [],
  tf2Folder: '',
};
function detect() {
  tf2DRC.tf2Exec = [];
  detectDiscord();
  detectTF2()
}

function sendAsync(msg) {
  mainWindow.webContents.send('async', msg);
}

app.on('ready', () => {
  createTray();
  createWindow();


  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('closed', () => (mainWindow = null));

  mainWindow.on('maximize', () => mainWindow.webContents.send('maximize'));

  mainWindow.on('unmaximize', () => mainWindow.webContents.send('unmaximize'));

  if (!settings.has('clientId')) {
    settings.set('clientId', clientId);
  }

  if (!settings.has('state')) {
    settings.set('state', {
      state: 'Estou usando o MakeYourRPC',
      details: 'https://github.com/SrSheep/MakeYourRPC'
    });
  }

  if (!settings.has('images')) {
    settings.set('images', {
      largeImage: 'fundo',
      smallImage: 'lua',
      largeImageTooltip: 'MakeYourRPC',
      smallImageTooltip: 'MakeYourRPC'
    });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipc.on('detect', () => detect());

ipc.on('stoprpc', () => destroyRPC());

ipc.on('startrpc', async () => {
  initRPC(clientId);
});

ipc.on('saverpc', async () => {
  settings.clearPath();
  let details = await mainWindow.webContents.executeJavaScript(
    'var text = "textContent" in document.body ? "textContent" : "innerText";document.getElementById("details")[text];'
  );
  let state = await mainWindow.webContents.executeJavaScript(
    'var text = "textContent" in document.body ? "textContent" : "innerText";document.getElementById("state")[text];'
  );
  let largeImage = await mainWindow.webContents.executeJavaScript(
    'var text = "textContent" in document.body ? "textContent" : "innerText";document.getElementById("limage")[text];'
  );
  let largeImageTooltip = await mainWindow.webContents.executeJavaScript(
    'var text = "textContent" in document.body ? "textContent" : "innerText";document.getElementById("ltext")[text];'
  );
  let smallImage = 'tf2_logo';
  let smallImageTooltip = 'Team Fortress 2'
  if (process.argv[0] === 'electron') {
    mallImageTooltip = 'Still Testing';
  }

  settings.set('clientId', clientId);
  settings.set('state', {
    state: state,
    details: details
  });
  settings.set('images', {
    largeImage: largeImage,
    smallImage: smallImage,
    largeImageTooltip: largeImageTooltip,
    smallImageTooltip: smallImageTooltip
  });
});

function initRPC(id) {
  rpc = new DiscordRPC.Client({ transport: 'ipc' });
  rpc.once('ready', () => {
    setActivity();
    setTimeout(() => setActivity(), 1000);
  });
  rpc.login(id).catch(console.error);
}

function destroyRPC() {
  if (!rpc) return;
  rpc.clearActivity();
  rpc.destroy();
  rpc = null;
}

async function setActivity() {
  if (!rpc || !mainWindow) return;

  let details = await mainWindow.webContents.executeJavaScript(
    'var text = "textContent" in document.body ? "textContent" : "innerText";document.getElementById("details")[text];'
  );
  let state = await mainWindow.webContents.executeJavaScript(
    'var text = "textContent" in document.body ? "textContent" : "innerText";document.getElementById("state")[text];'
  );
  let largeImage = await mainWindow.webContents.executeJavaScript(
    'var text = "textContent" in document.body ? "textContent" : "innerText";document.getElementById("limage")[text];'
  );
  let largeImageTooltip = await mainWindow.webContents.executeJavaScript(
    'var text = "textContent" in document.body ? "textContent" : "innerText";document.getElementById("ltext")[text];'
  );
  let smallImage = 'tf2_logo'
  let smallImageTooltip = 'Team Fortress 2';
  if (process.argv[0] === 'electron') {
    smallImageTooltip = 'Still testing';
  }


  rpc.setActivity({
    details: details,
    state: state,
    largeImageKey: largeImage,
    largeImageText: largeImageTooltip,
    smallImageKey: smallImage,
    smallImageText: smallImageTooltip,
    instance: false
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    minWidth: 400,
    height: 700,
    minHeight: 300,
    icon: __dirname + '/src/img/256x256.png',
    frame: true,
    title: 'MakeYourRPC'
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, './src/index.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => (mainWindow = null));
}

function createTray() {
  tray = new Tray(path.join(__dirname, '/src/img/256x256.png'));
  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'MakeYourRPC',
      enabled: false
    },
    {
      label: 'Abrir',
      click: () => mainWindow.show()
    },
    {
      label: 'Fechar',
      click: () => app.quit()
    },
    { type: 'separator' }
  ]);

  tray.on('double-click', () => mainWindow.show());

  tray.setToolTip('MakeYourRPC');
  tray.setContextMenu(trayMenu);
}

function detectDiscord() {
  ps.lookup({
    comand: 'discord',
  },
  function (err, res) {
    if (err) {
      throw new Error(err);
    }
    res.forEach( (pr) => {
      if (pr) {
        tf2DRC.isOn.dis = true;
        }
    });
    if (tf2DRC.isOn.dis) {
      console.log('discord is on');
      sendAsync('{"p":"dis","st":true}');
    }
  }
);
}

function detectTF2() {
  ps.lookup({
    comand: 'hl2',
    arguments: 'tf',
  },
  function (err, res) {
    if (err) {
      throw new Error(err);
    }
    res.forEach( (pr) => {
      if (pr) {
        tf2DRC.isOn.tf2 = true;
        tf2DRC.tf2Exec.push(pr.command)
      }
    });

    if (tf2DRC.isOn.tf2) {
      console.log('tf2 is on');
      getTf2Folder();
    }
  }
);
}

function getTf2Folder() {

  for (i = 0; i < tf2DRC.tf2Exec.length; i++) {
    if (tf2DRC.tf2Exec[i].includes('Team Fortress 2')) {
      let index = tf2DRC.tf2Exec[i].lastIndexOf('\\');
      tf2DRC.tf2Folder = tf2DRC.tf2Exec[i].slice(0, index + 1);
    }
  }
  console.log('TF2 folder: ' + tf2DRC.tf2Folder);
  if (tf2DRC.tf2Folder == '') {
    tf2DRC.isOn.tf2 = false;
    sendAsync('{"p":"tf2","st":false}');
    return
  } else {
    sendAsync('{"p":"tf2","st":true}');
  }

  mainLoop = setInterval(updateRP, updateRate);
}


function updateRP() {
  let log = readConsoleLog();
  let clEv = 'CTFGCClientSystem::ShutdownGC\r\nCTFGCClientSystem - adding listener\r\nUnable to remove d:\\steam\\steamapps\\common\\team fortress 2\\tf\\textwindow_temp.html!\r\nShutdown function ShutdownMixerControls() not in list!!!\r\n';
  if (log.lastIndexOf(clEv) == log.length - clEv.length ) {
    console.log('Game was shutted down')
    clearInterval(mainLoop);
    mainWindow.close();
    process.exit()
  }

  if (rpcReady) {
    rpc.setActivity({
      details: `test`,
      state: 'test',
      // largeImageKey: 'test',
      // largeImageText: 'test',
      // smallImageKey: 'test',
      // smallImageText: 'test',
      instance: false,
    });
  }

}

function readConsoleLog() {
  let path = tf2DRC.tf2Folder + 'tf/console.log';
  let f = fs.readFileSync(path, 'utf-8');
  return f;
}
