/* Necessary because InstantClick maintainer refuses to add module support. :/ */
//=include bower_components/instantclick/instantclick.js
window['InstantClick'] = InstantClick;
window['InstantClick'].init();

window['bsn'] = require('bootstrap.native');
window['collapse'] = window['bsn'].collapse;

window['wFL'] = require('webfontloader');
window['wFL'].load({
  google: {
    families: ['Lato:300,400,400italic', 'Open Sans Condensed:300,700']
  }
});

function enableCollapse() {
  var Collapses;
  Collapses = document.querySelectorAll('[data-toggle="collapse"]');
  [].forEach.call(Collapses, function(item) {
    var options;
    options = {};
    options.duration = item.getAttribute('data-duration');
    return new window['collapse'](item, options);
  });
}

window.addEventListener('a.load', function() {
  /* Re-bind collapse on DOM rewrite. */
  window['InstantClick'].on('change', enableCollapse);
  enableCollapse();
});
