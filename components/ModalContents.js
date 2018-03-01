import PropTypes from 'prop-types';
import * as styles from './ModalContents.css';

const ModalContents = ({ title, children }) => (
  <div className={styles.container}>
    <h2>{title}</h2>
    {children}
  </div>
);

ModalContents.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.any.isRequired,
}

export default ModalContents;
