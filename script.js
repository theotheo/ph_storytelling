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
    const d = 0.2
    return [
        [x - d, y + d],
        [x + d, y + d],
        [x + d, y - d],
        [x - d, y - d]
    ]
}

const coords = pointToRect(...[16.37983, 48.22019])


const createLayer = (name) => {
    console.log(name)
    map.addSource(name, {
        'type': 'image',
        'url': `./heroes/${name}.png`,
        'coordinates': coords
    });
    map.addLayer({
        id: `${name}-layer`,
        'type': 'raster',
        'source': name,
        'paint': {
            'raster-fade-duration': 0,
            'raster-opacity': 0
        },
        'maxzoom': 7.5
    });
}

const heroes = ['Кун.png',
    'Милль.png',
    'Лакатос.png',
    'Витгенштейн.png',
    'Нейрат.png',
    'Спенсер.png',
    'Рассел.png',
    'Авенариус.png',
    'Фейрабенд.png',
    'Поппер.png',
    'Конт.png',
    'Мах.png',
    'Пуанкаре.png',
    'Уайтхед.png',
    'Шлик.png',
    'Карнап.png',
]

map.on('style.load', () => {
    heroes.forEach(fn => {
        createLayer(fn.split('.')[0])
    })
})