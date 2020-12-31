/**
 * Service worker - background app script to cache files,
 * allowing the whole thing to run offline.
 */

 /**
  * When installing:
  */
self.addEventListener('install', function(e) {
  e.waitUntil(
    // create a cache called "med-lists"
    caches.open('med-lists').then(function(cache) {
      // add the following files to the cache
      return cache.addAll([
        '.',

      // don't cache the following files while debugging - they are likely to change!

      //  'index.html',
      //  'medicine.js',
      //  'medicine.css',
        'lib/jquery-3.3.1.min.js',
        'lib/jquery-ui.min.js',
        'lib/jquery-ui.min.css',
        'lib/jquery-ui.theme.min.css',
        'lib/jquery.history.js',
        'lib/jquery.mmenu.all.js',
        'lib/jquery.mmenu.all.css',
        'lib/fontawesome.min.css',
        'lib/fa-solid.min.css',
        'lib/d3v4.js',
        'lib/cola.min.js',
        'webfonts/pt-sans-v9-latin-regular.woff2',
        'webfonts/pt-sans-v9-latin-italic.woff2',
        'webfonts/pt-sans-v9-latin-700.woff2'
      ]);
    })
  );
});

/**
 * When the page requests data from the server, we can get it 
 * either from the server or from cache.
 * For library files, look in the cache first, and download if absent.
 * For other files, do a web request first, and if not connected, use cache.
 */
self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  // does the url contain ".min.", i.e. compressed javascript or css?
  if(url.match(/\.min\./)){ // library files won't change
    // cache-first approach:
    //IF DEBUG
    console.log("cache-first approach for:"+url);
    e.respondWith(
      caches.match(e.request).then(function(response) {
          return response || fetch(e.request);
      })
    );
  }else{
    // volatile files: use network-first approach, fallback to cache
    //IF DEBUG
    console.log("network-first approach for:"+url);
    e.respondWith(
      fetch(e.request).catch(function(){
        return caches.match(e.request);
      })
    );
  }
});