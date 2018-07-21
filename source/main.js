const fs = require('fs');
const pl = require("process-list");
const dis = require('./scripts/discord.js');
const tasks = require('./scripts/tasks.js');
const ps = require('ps-node');

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

detectDiscord();


let int = setInterval(() => {console.log('Discord is on: ' + isOn.discord); if (isOn.discord) clearInterval(int)}, 500);
