const fs = require('fs');
const pl = require("process-list");
const dis = require('./scripts/discord.js');
const tasks = require('./scripts/tasks.js');
const ps = require('ps-node');

let count = {
  dis: 0,
  tf2: 0,
}

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

detectDiscord();
detectTF2();


let int = setInterval(() => {console.log(count.dis + ' Discord is on: ' + isOn.discord); count.dis += 1; if (isOn.discord) clearInterval(int)}, 500);

let int2 = setInterval(() => {
  console.log(count.tf2 + ' TF2 is on: ' + isOn.tf2);
  count.tf2 += 1;
  if (isOn.tf2) {
     console.log(JSON.stringify(tf2Exec, null, '\t'));
     clearInterval(int2);
     getTf2Folder();
   }
 }, 500);

 function getTf2Folder() {
   let tf2Folder = '';
   for (i = 0; i < tf2Exec.length; i++) {
     if (tf2Exec[i].includes('Team Fortress 2')) {
       let index = tf2Exec[i].lastIndexOf('\\');
       tf2Folder = tf2Exec[i].slice(0, index + 1);
     }
   }
   console.log('TF2 folder: ' + tf2Folder);
 }
