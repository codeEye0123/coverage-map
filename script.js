mapboxgl.accessToken = 'pk.eyJ1Ijoic3RldmVmZXJuYW5kZXMiLCJhIjoiY202ZjdiY282MDI4cjJyb21sdTNpc2RscSJ9._ZV-quUh6eC0Oa_OiRaCGA';

const usBounds = [
  [-179, 18],
  [-66, 71]
];

const usCenter = [-98.5795, 39.8283];

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/stevefernandes/cm9hhvghf00q701qu5rktfrxb',
  center: usCenter,
  zoom: 4.3,
  maxBounds: usBounds,
  minZoom: 3,
  maxZoom: 17
});

map.addControl(new mapboxgl.NavigationControl(), 'top-right');

const showAlertTemporarily = (condition) => {
  if (condition) {
    const div = document.getElementById('ctrlZoom');
    div.style.display = 'block';

    setTimeout(() => {
      div.style.display = 'none';
    }, 5000); // Hide after 5 seconds
  }
}

map.scrollZoom.disable();

const mapContainer = document.getElementById('map');

mapContainer.addEventListener('wheel', function (e) {
  if (e.ctrlKey) {
    e.preventDefault();
    map.scrollZoom.enable();
  }
  else {
    e.preventDefault();
    map.scrollZoom.disable();
    showAlertTemporarily(true)
  }
}, { passive: true });

const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  placeholder: 'Search address or location in the US',
});

document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

let currentPopup = null;

map.on('load', () => {
 
  map.addSource('total-us-mobile-coverage', {
    type: 'raster',
    url: 'mapbox://stevefernandes.total-us-mobile-coverage'
  });

  map.addLayer({
    id: 'total-us-mobile-coverage',
    type: 'raster',
    source: 'total-us-mobile-coverage',
    paint: {
      'raster-opacity': 0.7,
    }
  }, 'aeroway-polygon');
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

function showPopup(coords, address, state) {

  const zoom = 12;
  const { x, y, z } = lngLatToTile(coords[0], coords[1], zoom);
  const tileUrl = `https://api.mapbox.com/v4/stevefernandes.total-us-mobile-coverage/${z}/${x}/${y}.png?access_token=${mapboxgl.accessToken}`;

  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);

    const pixel = getPixelCoords(coords[0], coords[1], x, y, z);

    if (pixel.x >= 0 && pixel.x < 256 && pixel.y >= 0 && pixel.y < 256) {
      const pixelData = context.getImageData(pixel.x, pixel.y, 1, 1).data;

      const coverageContent = `
        <div class="popup-content coverage">
          <h3>✅ Great news! Barn Owl has excellent coverage in ${address}!</h3>
          <p>Click to receive a 10% discount and 45-Day Free Trial.</p>
          <button id="proceed-btn">Claim Offer</button>
        </div>
      `;
      const noCoverageContent = `
        <div class="popup-content no-coverage">
          <h3>No Coverage</h3>
          <p>It looks like this spot doesn’t have coverage, but don’t worry! <br/> Try checking a nearby location to claim your discount.</p>
        </div>
      `;

      currentPopup = new mapboxgl.Popup({
        closeOnClick: false,
        anchor: 'bottom',
        offset: 25
      })
        .setLngLat(coords)
        .setHTML(pixelData[3] > 0 ? coverageContent : noCoverageContent)
        .addTo(map);

      if (pixelData[3] > 0) {
        // Attach event listener to the button
        setTimeout(() => {
          const proceedBtn = document.getElementById('proceed-btn');
          if (proceedBtn) {
            proceedBtn.onclick = () => {
              const formContent = `
                <div class="popup-content coverage">
                  <h3>Claim Your Special Offer</h3>
                  <p>Just enter your details to claim your 10% discount + 45-Day Free Trial!</p>
                  <form id="coverage-form">
                    <input type="text" id="first-name" placeholder="First Name" required>
                    <input type="text" id="last-name" placeholder="Last Name" required>
                    <input type="email" id="email" placeholder="Email Address" required>
                    <input type="tel" id="phone" placeholder="Phone Number" required>
                    <button type="submit">Shop 10% OFF Now</button>
                  </form>
                </div>
              `;
              currentPopup.setHTML(formContent);

              // Attach form submission handler
              setTimeout(() => {
                const form = document.getElementById('coverage-form');
                if (form) {
                  form.onsubmit = (event) => {
                    event.preventDefault();
                    const firstName = document.getElementById('first-name').value;
                    const lastName = document.getElementById('last-name').value;
                    const email = document.getElementById('email').value;
                    const phone = document.getElementById('phone').value;

                    if (firstName && lastName && email && phone) {
                      submitToKlaviyo(firstName, lastName, email, phone);
                      currentPopup.remove();
                      currentPopup = null;
                    } else {
                      alert('Please fill out all fields.');
                    }
                  };
                }
              }, 0);
            };
          }
        }, 0);
      }
    } else {
      currentPopup = new mapboxgl.Popup()
        .setHTML('<p>Error: Point outside tile</p>')
        .setLngLat(coords)
        .addTo(map);
    }
  };
  img.onerror = () => {
    currentPopup = new mapboxgl.Popup()
      .setHTML('<p>Error loading coverage data</p>')
      .setLngLat(coords)
      .addTo(map);
  };
  img.src = tileUrl;
}

geocoder.on('result', (e) => {
  const coords = e.result.center;

  document.querySelectorAll('div[aria-label="Map marker"]').forEach(div => div.remove());

  // Check if location is in the US
  const country = e.result.context?.find((c) => c.id.includes('country'))?.short_code;
  if (!country || country.toLowerCase() !== 'us') {
    if (currentPopup) {
      currentPopup.remove();
    }
    currentPopup = new mapboxgl.Popup()
      .setHTML('<p>Please search for a location within the United States.</p>')
      .setLngLat(usCenter)
      .addTo(map);
    map.flyTo({ center: usCenter, zoom: 4.3 });
    return;
  }

  currentMarker = new mapboxgl.Marker({
    color: '#FF6720'
  })
    .setLngLat(coords)
    .addTo(map);

  const markerElement = currentMarker.getElement();
  markerElement.style.cursor = 'pointer';

  // Remove existing popup
  if (currentPopup) {
    currentPopup.remove();
  }

  

  // Get address and state
  const address = e.result.text;
  const region = e.result.context?.find((c) => c.id.includes('region'));
  const state = region ? region.short_code : null;

  // Show popup immediately (no marker)
  currentMarker.getElement().addEventListener('click', () => {
    if (currentPopup) {
      currentPopup.remove();
      currentPopup = null;
    } else {
      showPopup(coords, address, null);
    }
  });

  showPopup(coords, address, state);

  map.flyTo({ center: coords, zoom: 12 });
});

function submitToKlaviyo(firstName, lastName, email, phone) {
  console.log('Submitting to Klaviyo:', { firstName, lastName, email, phone });
  // Add actual Klaviyo API integration here if needed
}