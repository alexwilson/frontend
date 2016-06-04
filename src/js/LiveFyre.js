scriptLoader('https://cdn.livefyre.com/Livefyre.js')
  .then(function(e) {
    Livefyre.require(['fyre.conv#3'], function (Conv) {
    new Conv({}, [{
      siteId: '376177',
      articleId: '{{ page.threadId }}',
      el: 'comments',
    }], function (commentsWidget) {}());
    });
  })
  .catch(function(e) { console.error(e) });
