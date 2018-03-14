import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as styles from '../Layout.css';

const AthleteHeader = ({ img, firstname, lastname, className }) => (
  <div className={classNames(
    styles['athlete-header'],
    className || false
  )}>
    <img className={styles['athlete-header__avatar']} src={img} />
    <span className={styles['athlete-header__name']}>{firstname} {lastname}</span>
  </div>
);

AthleteHeader.defaultProps = {
  className: '',
};

AthleteHeader.propTypes = {
  img: PropTypes.string.isRequired,
  firstname: PropTypes.string.isRequired,
  lastname: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default AthleteHeader;
