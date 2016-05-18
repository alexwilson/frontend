/* Necessary because InstantClick maintainer refuses to add module support. :/ */
//=include bower_components/instantclick/instantclick.js
window['InstantClick'] = InstantClick;
window['InstantClick'].init();

window['wFL'] = require('webfontloader');
window['wFL'].load({
  google: {
    families: ['Lato:300,400,400italic', 'Open Sans Condensed:300,700']
  }
});
