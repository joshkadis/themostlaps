import PropTypes from 'prop-types';
import mapboxgl from 'mapbox-gl';
import { getLocation } from '../../../utils/v2/locations';

const LocationHero = ({ location }) => (
  <h2>{getLocation(location).locationLabel}</h2>
);

LocationHero.propTypes = {
  location: PropTypes.string.isRequired,
};

export default LocationHero;
