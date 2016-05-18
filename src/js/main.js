/* Necessary because InstantClick maintainer refuses to add module support. :/ */
window['InstantClick'] = require("exports?InstantClick!instantclick");
window['InstantClick'].init();

window['wFL'] = require('webfontloader');
window['wFL'].load({
  google: {
    families: ['Lato:300,400,400italic', 'Open Sans Condensed:300,700']
  }
});
