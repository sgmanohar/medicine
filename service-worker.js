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
        '/medicine/',

      // don't cache the following files while debugging - they are likely to change!

      //  '/medicine/index.html',
      //  '/medicine/medicine.js',
      //  '/medicine/medicine.css',
        '/medicine/jquery-3.3.1.min.js',
        '/medicine/jquery-ui.min.js',
        '/medicine/jquery-ui.min.css',
        '/medicine/jquery-ui.theme.min.css',
        '/medicine/jquery.history.js',
        '/medicine/jquery.mmenu.all.js',
        '/medicine/jquery.mmenu.all.css',
        '/medicine/fontawesome.min.css',
        '/medicine/fa-solid.min.css',
        '/medicine/lib/d3v4.js',
        '/medicine/lib/cola.min.js',
        '/medicine/pt-sans-v9-latin-regular.woff2',
        '/medicine/pt-sans-v9-latin-italic.woff2',
        '/medicine/pt-sans-v9-latin-700.woff2'
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
    console.log("cache-first approach for:"+url);
    e.respondWith(
      caches.match(e.request).then(function(response) {
          return response || fetch(e.request);
      })
    );
  }else{
    // volatile files: use network-first approach, fallback to cache
    console.log("network-first approach for:"+url);
    e.respondWith(
      fetch(e.request).catch(function(){
        return caches.match(e.request);
      })
    );
  }
});