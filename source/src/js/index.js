window.onload = function () {
  if (settings.get('autostart')) {
    run();
  }
  ipc.send('detect');
}

function chStatus(pr, status) {
  let s;
  if (status) {
    s = 'ON';
  } else {
    s = 'OFF';
  }
  if (pr === 'tf2') {
    if (status){
      document.getElementById('tf2-status').classList.remove('status-off');
      document.getElementById('tf2-status').classList.add('status-on');
    } else {
      document.getElementById('tf2-status').classList.remove('status-on');
      document.getElementById('tf2-status').classList.add('status-off');
    }
    document.querySelector('#tf2-status span').innerHTML = s;
  } else if (pr === 'dis') {
    if (status){
      document.getElementById('dis-status').classList.remove('status-off');
      document.getElementById('dis-status').classList.add('status-on');
    } else {
      document.getElementById('dis-status').classList.remove('status-on');
      document.getElementById('dis-status').classList.add('status-off');
    }
    document.querySelector('#dis-status span').innerHTML = s;
  }else if (pr === 'tf2-noCondebug') {
    noCondebug();
  }
}

function noCondebug() {
  alert('Team Fortress 2 is currently running, but it\'s missing a launch parameter \"-condebug\" which is needed in this app.\nIn order to launch TF2 with that parameter:\n1. Open your Steam library.\n2. Press right mouse button on \"Team Fortress 2\"\n3. Click on \"Properties\"\n4. Click \"Set launch options...\" button\n5. Add \"-condebug\" at the end (without \" \")\n6. Click  \"OK\"')
}
