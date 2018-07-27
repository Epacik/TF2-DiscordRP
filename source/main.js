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
const request = require("request");

let rpc;
let mainWindow;
let tray;


/**
 * ID of discord app
 * default: '429697664658178059'
 */
const clientId = '429697664658178059'

let mainLoop;

/**
 * How often RPC would be updated in `ms`
 * default: 500
 */
let updateRate = 500;

let dCounter = 0;

const tf2DRC = {
  isOn: {
    dis: false,
    tf2: false,
  },
  count: {
    dis: 0,
    tf2: 0,
  },
  rpcReady: false,
  condebug: false,
  tf2Exec: [],
  tf2Folder: '',
};

let gamemodes = [];
let maps = [];

const gamestate = {
    details: 'Main menu',
    state: 'Idle',
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

  getGM();
  getMaps();

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('closed', () => (mainWindow = null));

  mainWindow.on('maximize', () => mainWindow.webContents.send('maximize'));

  mainWindow.on('unmaximize', () => mainWindow.webContents.send('unmaximize'));

  if (!settings.has('clientId')) {
    settings.set('clientId', clientId);
  }

  if (!settings.has('autostart')) {
    settings.set('autostart', true);
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
    tf2DRC.rpcReady = true;
  });
  rpc.login(id).catch(console.error);
}

function destroyRPC() {
  if (!rpc) return;
  tf2DRC.rpcReady = false;
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
  let largeImage = "tf2_logo"
  let largeImageTooltip ='Team Fortress 2'
  let smallImage = 'none'
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
    width: 590,
    minWidth: 400,
    height: 420,
    minHeight: 300,
    icon: __dirname + '/src/img/256x256.png',
    frame: true,
    title: 'MakeYourRPC',
    resizable: false
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
        if (pr.arguments.includes('tf')) {
          tf2DRC.tf2Exec.push(pr.command);
          if (!pr.arguments.includes('-condebug')) {
            sendAsync('{"p":"tf2-noCondebug","st":true}');
          }
        }
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
  let clEv = 'Shutdown function ShutdownMixerControls() not in list!!!\r\n';
  if (log.includes(clEv)) {
    if (log.lastIndexOf(clEv) == log.length - clEv.length ) {
      console.log('Game was shutted down')
      clearInterval(mainLoop);
      mainWindow.close();
      fs.writeFileSync(tf2DRC.tf2Folder + 'tf/console.log', '');
      process.exit()
    } else if (log.lastIndexOf(clEv) != log.length - clEv.length) {
      log = log.slice(log.lastIndexOf(clEv) + clEv.length)
    }
  }
  if (log.length > 1) {

    let lc = getLastLines(log, 10);

    if (lc.includes('Team Fortress') && lc.includes('Map:')) {
      let map = lc.slice(lc.indexOf('Map:'));
      map = map.slice(0, map.indexOf('\r'));
      gamestate.details = detectMap(map);
      gamestate.state = detectGamemode(map);
    }

    lc = getLastLines(log, 5);
    if (lc.includes('Lobby destroyed')) {
      gamestate.details = "Main menu";
      gamestate.state = 'Idle';
    }

    lc = getLastLines(log, 1) //lc == lastCommand
    // console.log(`Last 10 commands: \n${lastCommand}`);
    if (lc.includes('Entering queue for match group 12v12 Casual Match')) {
      gamestate.state = 'Queued for Casual Match';
    } else if (lc.includes('Entering queue for match group 6v6 Ladder Match')) {
      gamestate.state = 'Queued for Ranked Match';
    } else if (lc.includes('Entering queue for match group MvM MannUp')) {
      gamestate.state = 'Queued for MvM Mann Up Match';
    } else if (lc.includes('Entering queue for match group MvM Practice')) {
      gamestate.state = 'Queued for MvM Training Match';
    } else if (lc.includes('SV_ActivateServer')) {
      gamestate.details = 'Creating local server';
      gamestate.state = 'Connecting';
    } else if (
      lc.includes('Lobby destroyed') ||
      lc.includes('Leaving queue for match group 6v6 Ladder Match') ||
      lc.includes('Leaving queue for match group 12v12 Casual Match') ||
      lc.includes('Leaving queue for match group MvM Practice') ||
      lc.includes('Leaving queue for match group MvM MannUp') ||
      lc.includes('Server shutting down') ||
      lc.includes('disconnecting')) {
      gamestate.details = "Main menu";
      gamestate.state = 'Idle';
    } else if (lc.includes('Disconnecting from abandoned match server')) {
      gamestate.state = 'Disconnecting from server';
    }

  }
  if (tf2DRC.rpcReady) {
    rpc.setActivity({
      details: gamestate.details,
      state: gamestate.state,
      largeImageKey: 'tf2_logo',
      largeImageText: 'Team Fortress 2',
      smallImageKey: 'none',
      smallImageText: 'test',
      instance: false,
    });

  }

}

function readConsoleLog() {
  let path = tf2DRC.tf2Folder + 'tf/console.log';
  let f = fs.readFileSync(path, 'utf-8');
  return f;
}

function getLastLines(str, counter) {
  // console.log('original str');
  // console.log(str);
  str = str.trim()
  // console.log('str trimmed');
  // console.log(str);
  let r = [];

  for (i = 0; i < counter; i++) {
    r.unshift(str.slice(str.lastIndexOf('\r\n')));
    str = str.slice(0, str.lastIndexOf('\r\n'));
    // console.log('str in for #' + i);
    // console.log(str);
  }
  // console.log(JSON.stringify(r));
  return r.join('');
}

function detectGamemode(map) {
  let gm;
  if (map.includes('_')) {
    gm = map.slice(5, map.indexOf('_'));
  } else {
    gm = 'Other';
  }
  let f = '';
  for (i = 0; i < gamemodes.length; i++) {
    if (gm === gamemodes[i].prefix) {
      gm = gamemodes[i].desc;
    }
    if (maps[i].medieval && map.slice(5) === maps[i].filename) {
      f = "(Medieval Mode)";
    }
  }
  if (map.slice(map.lastIndexOf('_') + 1) === 'event') {
    f = '(Halloween)';
  }

  gm += f;

  return "Playing: " + gm;
}

function detectMap(map) {
  let m = map.slice(5);
  console.log(m);
  for (i = 0; i < maps.length; i++) {
    if (m === maps[i].filename) {
      m = maps[i].mapname;
    }
  }
  return 'On: ' + m;
}

let getJSON = function(url, callback) {
  request({
  url: url,
  json: true
}, callback);
};

function getGM() {
 let url = 'https://gist.githubusercontent.com/Epat9/7c6abcef909d9d293d33c599898ff7eb/raw/';
 getJSON(url, (er, data) => {
   if (er !== null) {
     console.log('Invalid URL to gamemodes!');
     return;
   } else {
     console.log('Gamemodes updated succesfully!');
     gamemodes = data.body;
   }
 });
}

function getMaps() {
 let url = 'https://gist.githubusercontent.com/Epat9/e4edd035b771822ca9f9c21c7021902d/raw/';
 getJSON(url, (er, data) => {
   if (er !== null) {
     console.log('Invalid URL to maps!');
     return;
   } else {
     console.log('Maps updated succesfully!');
     maps = data.body;
   }
 });
}
