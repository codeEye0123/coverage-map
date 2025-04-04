mapboxgl.accessToken = 'pk.eyJ1Ijoic3RldmVmZXJuYW5kZXMiLCJhIjoiY202ZjdiY282MDI4cjJyb21sdTNpc2RscSJ9._ZV-quUh6eC0Oa_OiRaCGA';

const states = [
    { name: 'texas', short_code: 'US-TX' },
    { name: 'arizona', short_code: 'US-AZ' },
    { name: 'arkansas', short_code: 'US-AR' },
    { name: 'alaska', short_code: 'US-AL' },
    { name: 'connecticut', short_code: 'US-CT' },
    { name: 'colorado', short_code: 'US-CO' },
    { name: 'california', short_code: 'US-CA' },
    { name: 'delaware', short_code: 'US-DE' },
    { name: 'florida', short_code: 'US-FL' },
    { name: 'georgia', short_code: 'US-GA' },
    { name: 'hawaii', short_code: 'US-HI' },
    { name: 'idaho', short_code: 'US-CA' },
    { name: 'illinois', short_code: 'US-IL' },
    { name: 'indiana', short_code: 'US-IN' },
    { name: 'iowa', short_code: 'US-IA' },
];

const usBounds = [
    [-179, 18],
    [-66, 71]
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
    placeholder: 'Search address or location in the US',
});

document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

map.on('load', () => {
    console.log('Map loaded');
    states.forEach(state => {
        map.addSource(`${state.name}-coverage-source`, {
            type: 'raster',
            url: `mapbox://stevefernandes.${state.name}-mobile-coverage`
        });
    });
    states.forEach(state => {
        map.addLayer({
            id: `${state.name}-coverage`,
            type: 'raster',
            source: `${state.name}-coverage-source`,
            paint: {
                'raster-opacity': 0.5
            }
        });
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

function showModal(content, className) {
    const modal = document.getElementById('coverage-modal');
    const modalContent = document.getElementById('coverage-modal-content');
    
    modalContent.className = `modal-content ${className}`;
    modalContent.innerHTML = content;
    modal.style.display = 'flex';

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

geocoder.on('result', (e) => {
    const coords = e.result.center;
    console.log('Geocoder result:', coords);

    const country = e.result.context?.find((c) => c.id.includes('country'))?.short_code;
    if (!country || country.toLowerCase() !== 'us') {
        console.log('Location is not in the US');
        showModal('<p>Please search for a location within the United States.</p>', 'no-coverage');
        return;
    }

    map.flyTo({ center: coords, zoom: 12 });

    const zoom = 12;
    const { x, y, z } = lngLatToTile(coords[0], coords[1], zoom);
    console.log('Tile coordinates:', { x, y, z });

    let state = null;
    const region = e.result.context?.find((c) => c.id.includes('region'));
    state = region ? region.short_code : null;
    console.log('State:', state);

    const stateObj = states.find(item => item.short_code === state);
    if (!stateObj) {
        console.log('State not supported in coverage data');
        showModal('<p>Coverage data not available for this state.</p>', 'no-coverage');
        return;
    }
    const stateName = stateObj.name;

    const tileUrl = `https://api.mapbox.com/v4/stevefernandes.${stateName}-mobile-coverage/${z}/${x}/${y}.png?access_token=${mapboxgl.accessToken}`;
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

            if (pixelData[3] > 0) {
                const content = `
                    <h3>✅ Great news! Barn Owl has excellent coverage in your area!</h3>
                    <p>Enjoy 10% OFF your first order + a Risk-Free 45-Day Trial! Just enter your email to claim your special offer.</p>
                    <form id="coverage-form">
                        <input type="text" id="first-name" placeholder="First Name" required>
                        <input type="text" id="last-name" placeholder="Last Name" required>
                        <input type="email" id="email" placeholder="Email Address" required>
                        <input type="tel" id="phone" placeholder="Phone Number" required>
                        <button type="submit">Shop 10% OFF Now</button>
                    </form>
                `;
                showModal(content, 'coverage');

                document.getElementById('coverage-form').addEventListener('submit', (event) => {
                    event.preventDefault();
                    const firstName = document.getElementById('first-name').value;
                    const lastName = document.getElementById('last-name').value;
                    const email = document.getElementById('email').value;
                    const phone = document.getElementById('phone').value;

                    if (firstName && lastName && email && phone) {
                        submitToKlaviyo(firstName, lastName, email, phone); // Assuming this function exists
                    } else {
                        alert('Please fill out all fields.');
                    }
                });
            } else {
                const content = `
                    <h3>No Coverage</h3>
                    <p>It looks like this spot doesn’t have coverage, but don’t worry! <br/> Try checking a nearby location to claim your discount.</p>
                `;
                showModal(content, 'no-coverage');
            }
        } else {
            console.log('Pixel out of tile bounds');
            const content = '<p>Error: Point outside tile</p>';
            showModal(content, 'no-coverage');
        }
    };
    img.onerror = () => {
        console.error('Failed to load tile image');
        const content = '<p>Error loading coverage data</p>';
        showModal(content, 'no-coverage');
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