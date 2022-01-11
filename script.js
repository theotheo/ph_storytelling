import { fetchTsv } from "./assets/fetchtsv.js";
import { showMap, createChapters } from "./assets/system.js";
import { LOCATIONS } from "./locations.js";


const url = config.chapters;
if (url.endsWith('.tsv') || url.endsWith('output=tsv')) {
    config.chapters = await fetchTsv(url);
}
console.log(config.chapters)

const defaultZoom = 18
config.chapters = createChapters(config.chapters, LOCATIONS, defaultZoom);
showMap(config);


const pointToRect = (x, y) => {
    const d = 0.002
    return [
        [x - d, y + d],
        [x + d, y + d],
        [x + d, y - d],
        [x - d, y - d]
    ]
}

const coords = pointToRect(...[16.37983, 48.22019])


const createLayer = (name) => {
    window.map.addSource(name, {
        'type': 'image',
        'url': `./heroes/${name}.png`,
        'coordinates': coords
    });
    window.map.addLayer({
        id: `${name}-layer`,
        'type': 'raster',
        'source': name,
        'paint': {
            'raster-fade-duration': 0,
            'raster-opacity': 100
        },
    });
}

const heroes = ['кун.png',
    'милль.png',
    'лакатос.png',
    'витгништейн.png',
    'нейрат.png',
    'спенсер.png',
    'рассел.png',
    'авенариус.png',
    'фейрабенд.png',
    'поппер.png',
    'конт.png',
    'мах.png',
    'пуанкаре.png',
    'уайтхед.png',
    'шлик.png',
    'карнапп.png',
]

heroes.forEach(fn => {
    createLayer(fn.split('.')[0])
})