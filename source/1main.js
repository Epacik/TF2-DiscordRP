const fs = require('fs');
const dis = require('./scripts/discord.js');
const tasks = require('./scripts/tasks.js');
const ps = require('ps-node');

DiscordRPC.register(ClientId);

let rpc = new DiscordRPC.Client({ transport: 'ipc' });
let rpcReady = false

rpc.on('ready', () => {
  console.log("ready");
  rpcReady = true;
});





let tf2Folder = '';

let mainLoop;

let updateRate = 500;

let count = {
  dis: 0,
  tf2: 0,
}

/**
 *
 */
let tf2Exec = [];

const isOn = {
  discord: false,
  tf2: false,
};

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
        isOn.discord = true;
      }
    });
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
        isOn.tf2 = true;
        tf2Exec.push(pr.command)
      }
    });
  }
);
}

let int = {
  dis: undefined,
  tf2: undefined,
}

function detect() {
  isOn.tf2 = false;
  isOn.discord = false;
  tf2Exec = [];
  detectDiscord();
  detectTF2();
  int.dis = setInterval(() => {
     count.dis += 1;
      if (isOn.discord) {
        console.log('Discord is on');
        clearInterval(int.dis);
        rpc.login(ClientId).catch(console.error);
      }}, 500);
  int.tf2 = setInterval(() => {
    count.tf2 += 1;
    if (isOn.tf2) {
      console.log('TF2 is on');
       console.log(JSON.stringify(tf2Exec, null, '\t'));
       clearInterval(int.tf2);
       getTf2Folder();
     }
   }, 500);
}

 function getTf2Folder() {

   for (i = 0; i < tf2Exec.length; i++) {
     if (tf2Exec[i].includes('Team Fortress 2')) {
       let index = tf2Exec[i].lastIndexOf('\\');
       tf2Folder = tf2Exec[i].slice(0, index + 1);
     }
   }
   console.log('TF2 folder: ' + tf2Folder);
   if (tf2Folder == '') {
     detect();
     return
   }
   mainLoop = setInterval(updateRP, updateRate);
 }

function readConsoleLog() {
  let path = tf2Folder + 'tf/console.log';
  let f = fs.readFileSync(path, 'utf-8');
  return f;
}

function updateRP() {
  let log = readConsoleLog();
  let clEv = 'CTFGCClientSystem::ShutdownGC\r\nCTFGCClientSystem - adding listener\r\nUnable to remove d:\\steam\\steamapps\\common\\team fortress 2\\tf\\textwindow_temp.html!\r\nShutdown function ShutdownMixerControls() not in list!!!\r\n';
  if (log.lastIndexOf(clEv) == log.length - clEv.length ) {
    console.log('Game was shutted down')
    clearInterval(mainLoop)
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




detect();
