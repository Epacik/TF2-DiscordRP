const {
  Client
} = require('discord-rpc');
const log = require("fancy-log");
const rpc = new Client({
    transport: 'ipc'
  }),
  appClient = '429697664658178059';

rpc.on('ready', function () {
  rpc.setActivity({
    details: `It's a test`,
    state: `testing`,
    largeImageKey: 'tf2_logo',
    instance: false,
  });
})

  rpc.login(appClient).catch(log.error);
