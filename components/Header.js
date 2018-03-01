import PropTypes from 'prop-types';
import Link from 'next/link';
import Navigation from './Navigation';
import * as styles from './Header.css';
import { modalControlsShape } from '../utils/propTypes';
import { TML_Horizontal } from './lib/svg';

const Header = ({ modalControls, modalIsOpen }) => (
  <header className={styles.header}>
    <Link href="/">
      <a className={styles.logo}>
        <TML_Horizontal />
      </a>
    </Link>
    <Navigation
      modalControls={modalControls}
      modalIsOpen={modalIsOpen}
    />
  </header>
);

Header.propTypes = {
  modalControls: PropTypes.shape(modalControlsShape).isRequired,
  modalIsOpen: PropTypes.bool.isRequired,
};

export default Header;
