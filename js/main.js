// antoligy = window.antoligy || {};
// 
// (function gistLoader(window) {
//     var document = winodw.document;

//     function loadGist(gistId, filename) {
//         var callbackName    = 'gist'+gistId,
//             uri             = '//gist.github.com/'+gistId+'.json?callback='+callbackName;
//         if (filename !== null && filename !== '') {
//             uri += '&file='+filename;
//         }
//         window[callbackName] = function (gistData) {
//             delete window[callbackName];
//             var html = '<link rel="stylesheet" href="'+gistData.stylesheet+'"></link>';
//             html += gistData.div;
//             element = document.getElementById('gist'+gistId);
//             if (typeof(element) !== 'undefined') {
//                 element.innerHTML = html;
//             }
//             script.parentNode.removeChild(script);
//         };
//         var script = document.createElement('script');
//         script.setAttribute('src', uri);
//         document.body.appendChild(script);
//     }

// }(this));
//   (function(gistId, filename) {
//     var callbackName  = 'gist'+gistId,
//       uri             = '//gist.github.com/'+gistId+'.json?callback='+callbackName;
//     if (filename !== null && filename !== '') {
//       uri += '&file='+filename;
//     }
//     window[callbackName] = function (gistData) {
//       delete window[callbackName];
//       var html = '<link rel="stylesheet" href="'+gistData.stylesheet+'"></link>';
//       html += gistData.div;
//       element = document.getElementById('gist'+gistId);
//       if (typeof(element) !== 'undefined') {
//         element.innerHTML = html;
//       }
//       script.parentNode.removeChild(script);
//     };
//     var script = document.createElement('script');
//     script.setAttribute('src', uri);
//     document.body.appendChild(script);
//   }('1342013', 'atom.xml'));
//   

(function(window) {
    window.InstantClick.init();

    /* Re-bind collapse on DOM rewrite. */
    InstantClick.on('change', function() {
        var Collapses = document.querySelectorAll('[data-toggle="collapse"]');
        [].forEach.call(Collapses, function (item) {
            var options = {};
            options.duration = item.getAttribute('data-duration');
            return new Collapse(item,options);
        });
    });
}(this));