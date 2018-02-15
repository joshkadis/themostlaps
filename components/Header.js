import PropTypes from 'prop-types';
import Navigation from './Navigation';
import * as styles from './Header.css';
import { modalControlsShape } from '../utils/propTypes';

const Header = ({ pathname, modalControls }) => (
  <header className={styles.header}>
    <span className={styles.logo}>The Most Laps</span>
    <Navigation pathname={pathname} modalControls={modalControls}/>
  </header>
);

Header.propTypes = {
  pathname: PropTypes.string.isRequired,
  modalControls: PropTypes.shape(modalControlsShape).isRequired,
};

export default Header;
