const fs = require('fs');
const pl = require("process-list");
const dis = require('./scripts/discord.js');
const tasks = require('./scripts/tasks.js');
const ps = require('ps-node');
const rp = require("easy-rich-presence");

const uID = '429697664658178059';

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
  int.dis = setInterval(() => {console.log(count.dis + ' Discord is on: ' + isOn.discord); count.dis += 1; if (isOn.discord) clearInterval(int.dis)}, 500);
  int.tf2 = setInterval(() => {
    console.log(count.tf2 + ' TF2 is on: ' + isOn.tf2);
    count.tf2 += 1;
    if (isOn.tf2) {
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
  let clEv2 = `CTFGCClientSystem::ShutdownGC
CTFGCClientSystem - adding listener
Unable to remove d:\\steam\\steamapps\\common\\team fortress 2\\tf\\textwindow_temp.html!
Shutdown function ShutdownMixerControls() not in list!!!`;
  console.log(log);
  if (log.lastIndexOf(clEv) == log.length - clEv.length || log.lastIndexOf(clEv2) == log.length - clEv2.length) {
    console.log('Game was shutted down')
    clearInterval(mainLoop)
  }
}


detect();
