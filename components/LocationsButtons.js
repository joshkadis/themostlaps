import PropTypes from 'prop-types';
import * as styles from './pages/ranking/RankingMenu.css';
import MenuButton from './pages/ranking/MenuButton';
import { locations } from '../config';

const LocationsButtons = ({ style = {}, onClick = () => ({}) }) => (
  <div className={styles.RankingMenu__row} style={style}>
    {Object.values(locations).map(({ locationName }) => <MenuButton
      key={`location-button-${locationName}`}
      buttonKey='location'
      buttonVal={locationName}
      clickHandler={onClick}
    >{locations[locationName].locationLabel}</MenuButton>)
    }
  </div>
);

LocationsButtons.propTypes = {
  onClick: PropTypes.func,
};

export default LocationsButtons;
