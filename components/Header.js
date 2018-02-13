import PropTypes from 'prop-types';
import Navigation from './Navigation';
import * as styles from './Header.css';

const Header = ({ pathname }) => (
  <header className={styles.header}>
    <span className={styles.logo}>The Most Laps</span>
    <Navigation pathname={pathname}/>
  </header>
);

Header.propTypes = {
  pathname: PropTypes.string.isRequired,
};

export default Header;
