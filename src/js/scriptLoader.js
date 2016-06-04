const scriptLoader = (url) => {
  var script = new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = url;
    s.addEventListener('load', function() {
      resolve(url);
    }, false);
    s.addEventListener('error', function() {
      reject(url);
    }, false);
    document.body.appendChild(s);
  });
  return script;
}

export default scriptLoader;
