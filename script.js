mapboxgl.accessToken = 'pk.eyJ1Ijoic3RldmVmZXJuYW5kZXMiLCJhIjoiY202ZjdiY282MDI4cjJyb21sdTNpc2RscSJ9._ZV-quUh6eC0Oa_OiRaCGA';

const usBounds = [
    [-125, 24],
    [-66, 49]
];

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-98, 39],
    zoom: 3,
    maxBounds: usBounds,
    minZoom: 3,
    maxZoom: 17
});

const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    placeholder: 'Search address or location'
});

document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

map.on('load', () => {
    console.log('Map loaded');
    map.addSource('coverage-source', {
        type: 'raster',
        url: 'mapbox://stevefernandes.texas-mobile-coverage'
    });
    map.addLayer({
        id: 'texas-coverage',
        type: 'raster',
        source: 'coverage-source',
        paint: {
            'raster-opacity': 0.5
        }
    });
    console.log('Raster layer added');
});

function lngLatToTile(lng, lat, zoom) {
    const tileSize = 256;
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lng + 180) / 360) * n);
    const latRad = lat * Math.PI / 180;
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    return { x, y, z: zoom };
}

function getPixelCoords(lng, lat, tileX, tileY, zoom) {
    const tileSize = 256;
    const n = Math.pow(2, zoom);
    const tileLng = (tileX / n) * 360 - 180;
    const tileLatRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * tileY / n)));
    const tileLat = tileLatRad * 180 / Math.PI;

    const nextTileLng = ((tileX + 1) / n) * 360 - 180;
    const nextTileLatRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * (tileY + 1) / n)));
    const nextTileLat = nextTileLatRad * 180 / Math.PI;

    const pixelX = Math.floor(((lng - tileLng) / (nextTileLng - tileLng)) * tileSize);
    const pixelY = Math.floor(((tileLat - lat) / (tileLat - nextTileLat)) * tileSize);

    return { x: pixelX, y: pixelY };
}

geocoder.on('result', (e) => {
    const coords = e.result.center;
    console.log('Geocoder result:', coords);
    map.flyTo({ center: coords, zoom: 12 });

    const zoom = 12;
    const { x, y, z } = lngLatToTile(coords[0], coords[1], zoom);
    console.log('Tile coordinates:', { x, y, z });

    const tileUrl = `https://api.mapbox.com/v4/stevefernandes.texas-coverage-mobile-test/${z}/${x}/${y}.png?access_token=${mapboxgl.accessToken}`;
    console.log('Fetching tile:', tileUrl);

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);

        const pixel = getPixelCoords(coords[0], coords[1], x, y, z);
        console.log('Pixel coordinates:', pixel);

        if (pixel.x >= 0 && pixel.x < 256 && pixel.y >= 0 && pixel.y < 256) {
            const pixelData = context.getImageData(pixel.x, pixel.y, 1, 1).data;
            console.log('Pixel data (RGBA):', pixelData);

            const result = document.getElementById('result');
            if (pixelData[3] > 0) {
                result.innerHTML = '<p><strong>Covered:</strong> Service available here!</p>';
            } else {
                result.innerHTML = '<p><strong>Not Covered:</strong> No service available.</p>';
            }
        } else {
            console.log('Pixel out of tile bounds');
            document.getElementById('result').innerHTML = '<p>Error: Point outside tile</p>';
        }

        if (document.getElementById('post-check')) {
            const modal = document.getElementById('email-modal');
            if (modal) modal.style.display = 'flex';
        }
    };
    img.onerror = () => {
        console.error('Failed to load tile image');
        document.getElementById('result').innerHTML = '<p>Error loading coverage data</p>';
    };
    img.src = tileUrl;
});

function submitEmail() {
    const email = document.getElementById('user-email').value;
    if (email) {
        console.log('Email saved:', email);
        document.getElementById('email-modal').style.display = 'none';
        document.getElementById('map-container').style.display = 'block';
    } else {
        alert('Please enter a valid email.');
    }
}

function saveEmail() {
    const email = document.getElementById('user-email').value;
    if (email) {
        console.log('Email saved:', email);
        document.getElementById('email-modal').style.display = 'none';
    } else {
        alert('Please enter a valid email.');
    }
}