/*jshint esversion: 6 */
import { Workbox } from 'https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-window.prod.mjs';


const jsimport = (url) => {
    // to allow loading nodejs modules
    window.module = window.module || window;
    return new Promise((resolve, reject) => {
        let s = document.createElement('script');
        s.type = 'text/javascript';
        s.src = url;
        s.defer = true;
        s.addEventListener('error', () => reject(s), false);
        s.addEventListener('load', () => resolve(s), false);
        document.head.appendChild(s);
    });
};

mapboxgl.mwb = {};
mapboxgl.mwb.init = (map, layers) => {
    if ('serviceWorker' in navigator) {
        jsimport('https://cdn.jsdelivr.net/npm/@mapbox/tilebelt@1.0.1/index.min.js')
            .then(s => {
                const
                    caller = function () {
                        try {
                            let e = new Error;
                            throw e;
                        } catch (err) {
                            let
                                sep = (typeof InstallTrigger !== 'undefined') ? '@' : 'at ',
                                i;
                            let a = err.stack.split('\n').filter(e => e.indexOf(sep) > -1)[1],
                                b = a.substring(a.indexOf('(') + 1, a.lastIndexOf(')'));
                            b = (b == '') ? b = a.replace(sep, '') : b;
                            return b.substring(0, b.lastIndexOf('/') + 1).trim();
                        }
                    },
                    precacher = e => {
                        const
                            m = e.target,
                            z = m.getZoom() | 0,
                            bb = m.getBounds(),
                            bba = [bb._sw.lng, bb._sw.lat, bb._ne.lng, bb._ne.lat],
                            bbt = bboxToTile(bba),
                            isVisible = (t, b) => {
                                const
                                    tbb = tileToBBOX(t),
                                    tf = [
                                        { x: tbb[0], y: tbb[1] },
                                        { x: tbb[0], y: tbb[3] },
                                        { x: tbb[2], y: tbb[1] },
                                        { x: tbb[2], y: tbb[3] }
                                    ],
                                    bf = [
                                        { x: b[0], y: b[1] },
                                        { x: b[0], y: b[3] },
                                        { x: b[2], y: b[1] },
                                        { x: b[2], y: b[3] }
                                    ],
                                    contains = (box, p) => {
                                        if (p.x < box[0] || p.x > box[2] || p.y < box[1] || p.y > box[3]) {
                                            return false;
                                        } else {
                                            return true;
                                        }
                                    };
                                for (let i = 0; i < 4; i++) {
                                    if (contains(bba, tf[i])) {
                                        return true;
                                        break;
                                    }
                                }
                                for (let i = 0; i < 4; i++) {
                                    if (contains(tbb, bf[i])) {
                                        return true;
                                        break;
                                    }
                                }
                                return false;
                            },
                            getParentZ = (t, z) => {
                                if (t[2] == z) {
                                    return [getParent(t)];
                                } else if (t[2] == z - 1) {
                                    return [t];
                                } else {
                                    let
                                        tt = [t];
                                    for (let i = t[2]; i < z; i++) {
                                        tt.filter(a => a[2] == i && isVisible(a, bba)).forEach(a => tt.push(...getChildren(a)));
                                    }
                                    return tt.filter(a => a[2] == z - 1);
                                }
                            },
                            getChildrenZ = (t, z) => {
                                let
                                    tt = [t];
                                for (let i = t[2]; i < z + 1; i++) {
                                    tt.filter(a => a[2] == i && isVisible(a, bba)).forEach(a => tt.push(...getChildren(a)));
                                }
                                return tt.filter(a => a[2] == z + 1);
                            },
                            tile2url = (t, url) => {

                            },
                            tocache = [...getParentZ(bbt, z), ...getChildrenZ(bbt, z)],
                            urlsToCache = [];
                        mapboxgl.mwb.layers.forEach(l => {
                            let
                                c = tocache
                                    .filter(t => t[2] >= l.minzoom && t[2] <= l.maxzoom)
                                    .map(t => {
                                        let u = l.url;
                                        urlsToCache.push(u.replace('{x}', t[0])
                                            .replace('{y}', t[1])
                                            .replace('{z}', t[2]));
                                    });
                        });
                        mwb.messageSW({
                            type: 'CACHE_URLS',
                            payload: { urlsToCache },
                        });
                    },
                    path = caller() + 'mwb.js',
                    mwb = new Workbox(path);

                mapboxgl.mwb.layers = layers.map(l => {
                    const source = map.getLayer(l.name).source;
                    l.source = source;
                    l.url = map.getSource(source).tiles[0];
                    l.minzoom = l.minzoom || map.getSource(source).minzoom;
                    l.maxzoom = l.maxzoom || map.getSource(source).maxzoom;
                    return l;
                });

                mwb.addEventListener('activated', e => {
                    console.log('mwb activated');
                });

                map.on('moveend', e => {
                    //#region benchmark
                    console.log('Start');
                    console.timeEnd('benchmark');
                    console.time('benchmark');
                    if (mapboxgl.mwb.layers.reduce((acc, l) => acc && map.isSourceLoaded(l.source), true)){
                        console.timeEnd('benchmark');
                        console.log('End-inmediate');                        
                    }else{
                        map.once('sourcedata', e=>{
                            console.timeEnd('benchmark');
                            console.log('End');
                        });
                    }                    
                    //#endregion

                    precacher(e);

                });

                mwb.register();

                precacher({target:map});

            });
    }
};

