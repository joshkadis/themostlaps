import mapboxgl from 'mapbox-gl';
import { mapboxPublicToken } from '../../../config';

/**
 * Render a Mapbox map
 *
 * @param {String} container Container element ID
 */
function renderMap(container) {
  mapboxgl.accessToken = mapboxPublicToken;
  const map = new mapboxgl.Map({
    container,
    style: 'mapbox://styles/mapbox/streets-v11',
  });
}

module.exports = {
  renderMap,
};
