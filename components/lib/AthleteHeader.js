import PropTypes from 'prop-types';
import * as styles from '../Layout.css';

const AthleteHeader = ({ img, firstname, lastname, style }) => (
  <span className={styles['athlete-header']} style={style}>
    <img className={styles['athlete-header__avatar']} src={img} />
    <span className={styles['athlete-header__name']}>{firstname} {lastname}</span>
  </span>
);

AthleteHeader.defaultProps = {
  style: {},
};

AthleteHeader.propTypes = {
  img: PropTypes.string.isRequired,
  firstname: PropTypes.string.isRequired,
  lastname: PropTypes.string.isRequired,
  style: PropTypes.object,
};

export default AthleteHeader;
