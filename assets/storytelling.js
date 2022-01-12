const layerTypes = {
    'fill': ['fill-opacity'],
    'line': ['line-opacity'],
    'circle': ['circle-opacity', 'circle-stroke-opacity'],
    'symbol': ['icon-opacity', 'text-opacity'],
    'raster': ['raster-opacity'],
    'fill-extrusion': ['fill-extrusion-opacity'],
    'heatmap': ['heatmap-opacity']
}

const alignments = {
    'left': 'lefty',
    'center': 'centered',
    'right': 'righty',
    'full': 'fully'
}

function getLayerPaintType(layer) {
    const layerType = map.getLayer(layer).type;
    return layerTypes[layerType];
}

function setLayerOpacity(layer) {
    console.log(layer)
    const paintProps = getLayerPaintType(layer.layer);
    paintProps.forEach(function(prop) {
        const options = {};
        if (layer.duration) {
            const transitionProp = prop + "-transition";
            options = { "duration": layer.duration };
            map.setPaintProperty(layer.layer, transitionProp, options);
        }
        map.setPaintProperty(layer.layer, prop, layer.opacity, options);
    });
}
export function showMap(config) {
    const story = document.getElementById('story');
    const features = document.createElement('div');
    features.setAttribute('id', 'features');

    const header = document.createElement('div');

    if (config.title) {
        const titleText = document.createElement('h1');
        titleText.innerText = config.title;
        header.appendChild(titleText);
    }

    if (config.subtitle) {
        const subtitleText = document.createElement('h2');
        subtitleText.innerText = config.subtitle;
        header.appendChild(subtitleText);
    }

    if (config.byline) {
        const bylineText = document.createElement('p');
        bylineText.innerText = config.byline;
        header.appendChild(bylineText);
    }

    if (header.innerText.length > 0) {
        header.classList.add(config.theme);
        header.setAttribute('id', 'header');
        story.appendChild(header);
    }

    config.chapters.forEach((record, idx) => {
        const container = document.createElement('div');
        const chapter = document.createElement('div');

        if (record.title) {
            const title = document.createElement('h3');
            title.innerText = record.title;
            chapter.appendChild(title);
        }

        if (record.image) {
            const image = new Image();
            image.src = record.image;
            chapter.appendChild(image);
        }

        if (record.description) {
            const story = document.createElement('p');
            story.innerHTML = record.description;
            chapter.appendChild(story);
        }

        container.setAttribute('id', record.id);
        container.classList.add('step');
        if (idx === 0) {
            container.classList.add('active');
        }

        chapter.classList.add(config.theme);
        container.appendChild(chapter);
        container.classList.add(alignments[record.alignment] || 'centered');
        if (record.hidden) {
            container.classList.add('hidden');
        }
        features.appendChild(container);
    });

    story.appendChild(features);

    const footer = document.createElement('div');

    if (config.footer) {
        const footerText = document.createElement('p');
        footerText.innerHTML = config.footer;
        footer.appendChild(footerText);
    }

    if (footer.innerText.length > 0) {
        footer.classList.add(config.theme);
        footer.setAttribute('id', 'footer');
        story.appendChild(footer);
    }

    mapboxgl.accessToken = config.accessToken;

    const transformRequest = (url) => {
        const hasQuery = url.indexOf("?") !== -1;
        const suffix = hasQuery ? "&pluginName=scrollytellingV2" : "?pluginName=scrollytellingV2";
        return {
            url: url + suffix
        }
    }

    const map = new mapboxgl.Map({
        container: 'map',
        style: config.style,
        center: config.chapters[0].location.center,
        zoom: config.chapters[0].location.zoom,
        bearing: config.chapters[0].location.bearing,
        pitch: config.chapters[0].location.pitch,
        interactive: false,
        transformRequest: transformRequest
    });
    console.log('MAAAP')
    window.map = map


    if (config.use3dTerrain) {
        map.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
        });
        // add the DEM source as a terrain layer with exaggerated height
        map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

        // add a sky layer that will show when the map is highly pitched
        map.addLayer({
            'id': 'sky',
            'type': 'sky',
            'paint': {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0.0, 0.0],
                'sky-atmosphere-sun-intensity': 15
            }
        });
    };

    if (config.showMarkers) {
        const marker = new mapboxgl.Marker({ color: config.markerColor });
        marker.setLngLat(config.chapters[0].location.center).addTo(map);
    }
    // instantiate the scrollama
    const scroller = scrollama();


    const jitter = (min, max) => {
        return parseFloat((Math.random() * (max - min) + min).toFixed(4), 4)
    }

    const pointToRect = (x, y, zoom) => {
            // x = x + jitter(0.50, 0.200)
            // console.log(x)
            // y = y + jitter(0.50, 0.200)


            let d;
            if (zoom < 3) {
                d = 3
            } else if (zoom < 7) {
                d = 1
            } else if (zoom < 10) {
                d = 0.05
            } else {
                d = 0.02
            }

            return [
                [x - d, y + d],
                [x + d, y + d],
                [x + d, y - d],
                [x - d, y - d]
            ]
        }
        // setup the instance, pass callback functions
    scroller
        .setup({
            step: '.step',
            offset: 0.4,
            progress: true
        })
        .onStepEnter(response => {
            const chapter = config.chapters.find(chap => chap.id === response.element.id);
            response.element.classList.add('active');
            map[chapter.mapAnimation || 'flyTo'](chapter.location);
            if (config.showMarkers) {
                marker.setLngLat(chapter.location.center);
            }
            console.log(chapter)

            if (chapter.onChapterEnter.length > 0) {
                chapter.onChapterEnter.forEach(setLayerOpacity);
            }
            if (chapter.callback) {
                chapter.callback();
            }
            if (chapter.year) {
                document.querySelector('#year').innerHTML = chapter.year
            }
            if (chapter.heroes) {
                console.log('heroes')
                chapter.heroes.forEach(h => {
                    console.log(h)
                        // const point = [h.point[0] + jitter(0.120, 0.0200), h.point[1] + jitter(0.120, 0.0200)]
                    const mySource = map.getSource(h.name);

                    mySource.setCoordinates(pointToRect(h.point[0], h.point[1], chapter.location.zoom))

                    if (h.opacity) {
                        map.setPaintProperty(
                            `${h.name}-layer`,
                            'raster-opacity',
                            parseInt(h.opacity, 10) / 100
                        );
                    }
                })
            }
            if (chapter.rotateAnimation) {
                map.once('moveend', function() {
                    const rotateNumber = map.getBearing();
                    map.rotateTo(rotateNumber + 90, {
                        duration: 24000,
                        easing: function(t) {
                            return t;
                        }
                    });
                });
            }
            if (chapter.lines) {
                console.log('lines')
                chapter.lines.forEach((line, index) => {
                    console.log(line)

                    map.addSource(`lines-${index}`, {
                        'type': 'geojson',
                        'data': {
                            'type': 'Feature',
                            'properties': {
                                'color': line.color
                            },
                            'geometry': {
                                'type': 'LineString',
                                'coordinates': line.coords
                            },
                        }
                    });
                    map.addLayer({
                        'id': `lines-${index}-layer`,
                        'type': 'line',
                        'source': `lines-${index}`,
                        'paint': {
                            'line-width': 10,
                            // Use a get expression (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-get)
                            // to set the line-color to a feature property value.
                            'line-color': ['get', 'color']
                        }
                    });
                })
            }

        })
        .onStepExit(response => {
            const chapter = config.chapters.find(chap => chap.id === response.element.id);
            response.element.classList.remove('active');
            if (chapter.onChapterExit.length > 0) {
                chapter.onChapterExit.forEach(setLayerOpacity);
            }
        });
    // setup resize event
    window.addEventListener('resize', scroller.resize);
}