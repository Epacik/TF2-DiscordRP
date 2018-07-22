const settings = require('electron-settings');

var text = 'textContent' in document.body ? 'textContent' : 'innerText';
document.getElementById('details')[text] = settings.get('state.details');
document.getElementById('state')[text] = settings.get('state.state');
document.getElementById('limage')[text] = settings.get('images.largeImage');
document.getElementById('ltext')[text] = settings.get(
  'images.largeImageTooltip'
);
