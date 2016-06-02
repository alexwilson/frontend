import InstantClick from 'instantclick2';
InstantClick.on('change', function() {
  if (typeof ga !== 'undefined') ga('send', 'pageview', location.pathname + location.search);
});
InstantClick.init();

import WebFontLoader from 'webfontloader';
WebFontLoader.load({
  google: {
    families: ['Lato:300,400,400italic', 'Open Sans Condensed:300,700']
  }
});
