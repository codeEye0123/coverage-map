mapboxgl.accessToken = 'pk.eyJ1Ijoic3RldmVmZXJuYW5kZXMiLCJhIjoiY202ZjdiY282MDI4cjJyb21sdTNpc2RscSJ9._ZV-quUh6eC0Oa_OiRaCGA';

const states = [
  { name: 'alabama-mobile-coverage', short_code: 'US-AL' },
  { name: 'arizona-mobile-coverage', short_code: 'US-AZ' },
  { name: 'arkansas-mobile-coverage', short_code: 'US-AR' },
  { name: 'alaska-mobile-coverage', short_code: 'US-AK' },
  { name: 'connecticut-mobile-coverage', short_code: 'US-CT' },
  { name: 'colorado-mobile-coverage', short_code: 'US-CO' },
  { name: 'california-mobile-coverage', short_code: 'US-CA' },
  { name: 'delaware-mobile-coverage', short_code: 'US-DE' },
  { name: '5mx295dz', short_code: 'US-DC' },
  { name: 'florida-mobile-coverage', short_code: 'US-FL' },
  { name: 'georgia-mobile-coverage', short_code: 'US-GA' },
  { name: 'hawaii-mobile-coverage', short_code: 'US-HI' },
  { name: 'idaho-mobile-coverage', short_code: 'US-CA' },
  { name: 'illinois-mobile-coverage', short_code: 'US-IL' },
  { name: 'indiana-mobile-coverage', short_code: 'US-IN' },
  { name: 'iowa-mobile-coverage', short_code: 'US-IA' },
  { name: 'kansas-mobile-coverage', short_code: 'US-KS' },
  { name: 'kentucky-mobile-coverage', short_code: 'US-KY' },
  { name: 'lousiana-mobile-coverage', short_code: 'US-LA' },
  { name: 'maine-mobile-coverage', short_code: 'US-ME' },
  { name: 'maryland-mobile-coverage', short_code: 'US-MD' },
  { name: 'massachusetts-mobile-coverage', short_code: 'US-MA' },
  { name: 'michigan-mobile-coverage', short_code: 'US-MI' },
  { name: 'minnesota-mobile-coverage', short_code: 'US-MN' },
  { name: 'mississippi-mobile-coverage', short_code: 'US-MS' },
  { name: 'missouri-mobile-coverage', short_code: 'US-MO' },
  { name: 'montana-mobile-coverage', short_code: 'US-MT' },
  { name: 'nebraska-mobile-coverage', short_code: 'US-NE' },
  { name: 'nevada-mobile-coverage', short_code: 'US-NV' },
  { name: 'new-hampshire-mobile-coverage', short_code: 'US-NH' },
  { name: 'new-jersey-mobile-coverage', short_code: 'US-NJ' },
  { name: 'new-mexico-mobile-coverage', short_code: 'US-NM' },
  { name: 'new-york-mobile-coverage', short_code: 'US-NY' },
  { name: 'north-carolina-mobile-coverage', short_code: 'US-NC' },
  { name: 'north-dakota-mobile-coverage', short_code: 'US-ND' },
  { name: 'ohio-mobile-coverage', short_code: 'US-OH' },
  { name: 'oklahoma-mobile-coverage', short_code: 'US-OK' },
  { name: 'oregon-mobile-coverage', short_code: 'US-OR' },
  { name: 'pennsylvania-mobile-coverage', short_code: 'US-PA' },
  { name: 'rhode-island-mobile-coverage', short_code: 'US-RI' },
  { name: 'south-carolina-mobile-coverage', short_code: 'US-SC' },
  { name: 'south-dakota-mobile-coverage', short_code: 'US-SD' },
  { name: 'tennessee-mobile-coverage', short_code: 'US-TN' },
  { name: 'texas-mobile-coverage', short_code: 'US-TX' },
  { name: 'utah-mobile-coverage', short_code: 'US-UT' },
  { name: 'vermont-mobile-coverage', short_code: 'US-VT' },
  { name: 'virginia-mobile-coverage', short_code: 'US-VA' },
  { name: 'washington-mobile-coverage', short_code: 'US-WA' },
  { name: 'west-virginia-mobile-coverage', short_code: 'US-WV' },
  { name: 'wisconsin-mobile-coverage', short_code: 'US-WI' },
  { name: 'wyoming-mobile-coverage', short_code: 'US-WY' },
];

const usBounds = [
  [-179, 18],
  [-66, 71]
];

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/stevefernandes/cm97htwg300fo01qq4k6bguof',
  center: [-98.5795, 39.8283],
  zoom: 4,
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
    map.addSource(`${state.name}`, {
      type: 'raster',
      url: `mapbox://stevefernandes.${state.name}`
    });
  });

  states.forEach(state => {
    map.addLayer({
      id: `${state.name}`,
      type: 'raster',
      source: `${state.name}`,
      // paint: {
      //   'raster-opacity': 1,
      //   'raster-brightness-min': 0.1,
      //   'raster-brightness-max': 0.4,
      //   'raster-contrast': 0.8,
      //   'raster-saturation': -1
      // }
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

  const tileUrl = `https://api.mapbox.com/v4/stevefernandes.${stateName}/${z}/${x}/${y}.png?access_token=${mapboxgl.accessToken}`;
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