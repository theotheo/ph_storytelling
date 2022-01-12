// import {
//     YAML
// } from "https://code4sabae.github.io/js/YAML.js";
/*
import {
  TOML
} from "https://taisukef.github.io/toml-es/TOML.js";
*/
// import {
//     CSV
// } from "https://code4sabae.github.io/js/CSV.js";
import {
    showMap
} from "./storytelling.js";
import {
    fetchTsv
} from "./fetchtsv.js";
import {
    Geo3x3
} from "https://taisukef.github.io/Geo3x3/Geo3x3.mjs";

const addStyleSheet = (href) => {
    const link = document.createElement("link");
    link.href = href;
    link.rel = "stylesheet";
    document.head.appendChild(link);
};
const addScript = (src) => {
    const sc = document.createElement("script");
    sc.src = src;
    document.head.appendChild(sc);
};
const init = () => {
    addStyleSheet("https://api.tiles.mapbox.com/mapbox-gl-js/v2.1.1/mapbox-gl.css");
    addStyleSheet("./assets/style.css");
    addScript("https://api.tiles.mapbox.com/mapbox-gl-js/v2.1.1/mapbox-gl.js");
    addScript("https://unpkg.com/intersection-observer@0.5.1/intersection-observer.js");
    // addScript("https://unpkg.com/scrollama");

    const map = document.createElement("div");
    map.id = "map";
    document.body.appendChild(map);

    const story = document.createElement("div");
    story.id = "story";
    document.body.appendChild(story);
};
init();

const ALIGNMENT = 'right';
const ROTATE = false;
const PITCH = 60.0;

const DEFAULT = 6.65 / 47.61065 / 14.35969 / 10.40 / 60.00
const parseHash = (hash) => {
    const r = hash.split('/');
    return {
        zoom: r[0],
        center: [
            r[2],
            r[1]
        ],
        bearing: r[3] || 0,
        pitch: r[4] || PITCH
    };
}

const createChapters = (chapters, locations, defaultZoom) => {
    const makeLocation = (chapter, defaultZoom) => {
        if (chapter.hash) {
            return parseHash(chapter.hash)
        } else if (chapter.lat && chapter.lng) {
            return {
                zoom: chapter.zoom || defaultZoom,
                center: [chapter.lng, chapter.lat],
                bearing: chapter.bearing || 0,
                pitch: chapter.pitch || PITCH
            };
        } else if (chapter.geo3x3) {
            const pos = Geo3x3.decode(chapter.geo3x3);
            return {
                zoom: chapter.zoom || defaultZoom,
                center: [pos.lng, pos.lat],
                bearing: chapter.bearing || 0,
                pitch: chapter.pitch || PITCH
            };
        } else if (chapter.location) {
            return locations[chapter.location]
        }
        return null;
    };
    let n = 0;
    return chapters.map((chapter) => {
        n += 1;
        chapter.id = `chapter-${n}`;
        if (!chapter.alignment) {
            chapter.alignment = ALIGNMENT;
        }
        chapter.callback = null;
        // chapter.hidden = false;
        if (chapter.hidden) {
            chapter.hidden = chapter.hidden
        }
        // chapter.mapAnimation = 'flyTo';
        chapter.rotateAnimation = ROTATE;
        if (chapter.onChapterEnter) {
            chapter.onChapterEnter = JSON.parse(chapter.onChapterEnter);
        }
        if (chapter.heroes) {
            console.log(chapter.heroes)
            let heroes = JSON.parse(chapter.heroes)
            heroes.forEach((hero) => {
                if (typeof hero.point === 'string') {
                    const point = locations[hero.point].center
                        // const point2 = locations[line.coords[1]].center
                    hero.point = point
                }
            })
            chapter.heroes = heroes;
            console.log(chapter.heroes)
        }
        if (chapter.lines) {
            let lines = JSON.parse(chapter.lines)

            lines.forEach((line) => {
                if (typeof line.coords[0] === 'string') {
                    const point1 = locations[line.coords[0]].center
                    const point2 = locations[line.coords[1]].center
                    line.coords = [point1, point2]
                }
            })
            chapter.lines = lines;
            console.log(chapter.lines)

        }
        chapter.onChapterExit = [];
        chapter.location = makeLocation(chapter, defaultZoom);
        if (chapter.image) {
            chapter.image = `./images/${chapter.image}`
        }
        return chapter;
    });
}

const process = async(config) => {
    return new Promise(async(resolve) => {
        config.theme = 'light';
        config.showMarkers = false;
        const urlParams = new URLSearchParams(window.location.search);
        if (config.allowExternalSotry && urlParams.has('story')) {
            config.chapters = window.location.search.split('story=')[1]
                // specify map title
            if (urlParams.has('title')) {
                config.title = urlParams.get('title')
            }
            // specify default zoom level
            if (urlParams.has('zoom')) {
                config.defaultZoom = parseInt(urlParams.get('zoom'))
            }
        }
        // load data from another file
        if (typeof config.chapters === 'string') {
            const url = config.chapters;
            if (url.endsWith('.tsv') || url.endsWith('output=tsv')) {
                config.chapters = await fetchTsv(url);
            } else if (url.endsWith(".yml")) {
                const yml = await (await fetch(url)).text();
                config.chapters = YAML.parse(yml);
                //} else if (url.endsWith(".toml")) {
                //  const yml = await (await fetch(url)).text();
                //  config.chapters = TOML.parse(yml);
            } else if (url.endsWith(".csv")) {
                const csv = await CSV.fetch(url);
                config.chapters = CSV.toJSON(csv);
            } else if (url.endsWith(".json")) {
                const data = await (await fetch(url)).json();
                config.chapters = data;
            }
        }
        config.chapters = createChapters(config.chapters, config.defaultZoom || 10);
        resolve(config)
    });
};

export { process, createChapters, showMap };