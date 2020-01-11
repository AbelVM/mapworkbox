# MapWorkBox
Little PoC to test dynamic precaching for map tiles

![](https://raw.githubusercontent.com/mapbox/mapbox-gl-js-docs/publisher-production/docs/pages/assets/logo.png)
![](https://user-images.githubusercontent.com/110953/28352645-7a8a66d8-6c0c-11e7-83af-752609e7e072.png)

## WTF is this

This is a little Frankenstein monster made to check whether the use of [Workbox](https://github.com/googlechrome/workbox) as precaching manager and some dark magic could smooth even more the [Mapbox GL JS](https://github.com/mapbox/mapbox-gl-js) experience by precaching the most possible upcoming tiles requests.

**THIS IS NOT PRODUCTION READY, AS OF TODAY IT'S JUST A PROOF OF CONCEPT.** Feel free to fork it and PR to improve it if you're in the mood.

## The demo

### https://abelvm.github.io/mapworkbox/

## And, how does it work?

It relies on **Workbox** libraries to ease the cache management through [service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), so the main thread is kept isolated from this task.

Every time the map ends a movement (zoom, pan, whatever), the service worker starts precaching the potentially upcoming tiles in the background. The criterium in this PoC is that `any tile with at least one point in the current viewport and zoom levels z+1 or z-1 will be precached`. This could flood the cache, so the number of tiles will be limited to 250 and 2min as oldest.

BTW, I'm using [tilebelt](https://github.com/mapbox/tilebelt) for all the viewport-tiles logic.

## Results

Quite impressive indeed. Using [Mapillary coverage layers](https://www.mapillary.com/developer/tiles-documentation) with a heatmap in the lower zoom levels (as it's a CPU consuming styling), I have found that **this technique lowers the source loading time to a 35% of the original time and improves the cache hits in up to 50%, so up to 85% of the tiles requests are served from cache vs 55% without precaching**.

## How to use it

You need to add both `mapworkbox.mjs` and `mwb.js` to a folder in your project and load only the first file, but **as module**. Any other requirements are dynamically loaded.

```html
    <script src="mapworkbox.mjs" type="module"></script>
```

You might want to edit the cache limits, located at `mwb.js` file


```javascript
    expconfig ={
        maxEntries: 250,
        maxAgeSeconds: 120
    }
```

Then, just initialize the service worker in the `onload` event of your Mapbox map

```javascript
    map.on('load', e => {
        mapboxgl.mwb.init(e.target, layers);
    });
```

Being `layers` the list of layers to be precached, as an array of objects, each of them like

```javascript
    {
        name: 'mylayername',
        minzoom: 5,
        maxzoom: 10
    }
```

`minzoom` and `maxzoom` are optional and it would take the layer source zoom limits for the sake of precaching.

## Caveats

Take into account that this technique will make use of extra bandwidth and extra disk space as the criterium to choose the next-to-be-requested tiles is quite simplistic. In the example, the cache size is kept under 200MB and usually has 45MB-75MB size.

Do **NOT** trust the Chrome Dev. Console in terms of service workers and cache storage (`Application` tab). Same applies to the Workbox methods that are supossed to return cache related info (like [this](https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-precaching.PrecacheController#getCachedURLs)).

If you benchmark this with a map with a not precached layer, the results might be misleading as the timer would be affected by the loading time of the tiles of that layer.