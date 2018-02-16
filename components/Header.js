import PropTypes from 'prop-types';
import Navigation from './Navigation';
import * as styles from './Header.css';
import { modalControlsShape } from '../utils/propTypes';
import { TML_Horizontal } from './lib/svg';

const Header = ({ modalControls }) => (
  <header className={styles.header}>
    <TML_Horizontal className={styles.logo}/>
    <Navigation modalControls={modalControls}/>
  </header>
);

Header.propTypes = {
  modalControls: PropTypes.shape(modalControlsShape).isRequired,
};

export default Header;
