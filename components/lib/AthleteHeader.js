import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as styles from '../Layout.css';

const AthleteHeader = ({ img, firstname, lastname, className, reverse }) => (
  <div className={classNames(
    styles['athlete-header'],
    { [styles['athlete-header__reverse']]: reverse },
    className || false
  )}>
    <img className={styles['athlete-header__avatar']} src={img} />
    <span className={styles['athlete-header__name']}>{firstname} {lastname}</span>
  </div>
);

AthleteHeader.defaultProps = {
  className: '',
  reverse: false,
};

AthleteHeader.propTypes = {
  img: PropTypes.string.isRequired,
  firstname: PropTypes.string.isRequired,
  lastname: PropTypes.string.isRequired,
  className: PropTypes.string,
  reverse: PropTypes.bool,
};

export default AthleteHeader;
