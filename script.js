// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic3RldmVmZXJuYW5kZXMiLCJhIjoiY202ZjdiY282MDI4cjJyb21sdTNpc2RscSJ9._ZV-quUh6eC0Oa_OiRaCGA';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-95, 31],
    zoom: 6
});

const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    placeholder: 'Enter address or ZIP code'
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

// Function to convert lat/lng to tile coordinates
function lngLatToTile(lng, lat, zoom) {
    const tileSize = 256; // Mapbox uses 512x512 tiles for raster
    const n = Math.pow(2, zoom);
    const x = Math.floor(((lng + 180) / 360) * n);
    const latRad = lat * Math.PI / 180;
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    return { x, y, z: zoom };
}

// Function to get pixel coordinates within the tile
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
    const coords = e.result.center; // [lng, lat]
    console.log('Geocoder result:', coords);
    map.flyTo({ center: coords, zoom: 12 });

    // Use Raster Tiles API to fetch the tile
    const zoom = 12; // Match the zoom level after flyTo
    const { x, y, z } = lngLatToTile(coords[0], coords[1], zoom);
    console.log('Tile coordinates:', { x, y, z });

    const tileUrl = `https://api.mapbox.com/v4/stevefernandes.texas-coverage-mobile-test/${z}/${x}/${y}.png?access_token=${mapboxgl.accessToken}`;
    console.log('Fetching tile:', tileUrl);

    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Allow canvas access to external image
    img.onload = () => {
        // Create a canvas to analyze the tile
        const canvas = document.createElement('canvas');
        canvas.width = 256; // Match Mapbox raster tile size
        canvas.height = 256;
        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);

        // Get pixel coordinates within the tile
        const pixel = getPixelCoords(coords[0], coords[1], x, y, z);
        console.log('Pixel coordinates:', pixel);

        // Ensure pixel is within bounds
        if (pixel.x >= 0 && pixel.x < 256 && pixel.y >= 0 && pixel.y < 256) {
            const pixelData = context.getImageData(pixel.x, pixel.y, 1, 1).data;
            console.log('Pixel data (RGBA):', pixelData);

            const result = document.getElementById('result');
            // Adjust this condition based on your raster's coverage color
            if (pixelData[3] > 0) { // Non-transparent = coverage (example)
                result.innerHTML = '<p><strong>Covered:</strong> Service available here!</p>';
            } else {
                result.innerHTML = '<p><strong>Not Covered:</strong> No service available.</p>';
            }
        } else {
            console.log('Pixel out of tile bounds');
            document.getElementById('result').innerHTML = '<p>Error: Point outside tile</p>';
        }

        // Post-check modal logic
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

// Email handling for Version 1 (upfront)
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

// Email handling for Version 2 (post-check)
function saveEmail() {
    const email = document.getElementById('user-email').value;
    if (email) {
        console.log('Email saved:', email);
        document.getElementById('email-modal').style.display = 'none';
    } else {
        alert('Please enter a valid email.');
    }
}