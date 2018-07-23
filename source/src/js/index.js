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
  }
}
