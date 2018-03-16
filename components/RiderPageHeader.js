import PropTypes from 'prop-types';
import classNames from 'classnames';
import AthleteHeader from './lib/AthleteHeader';
import * as styles from './RiderPageHeader.css';
import { locale } from '../config';


const getRiderInfoClassName = () => classNames(
  'big',
  styles.riderPageHeader_info,
);

const RiderPageHeader = ({
  firstname,
  lastname,
  img,
  allTime,
  single,
  className,
}) => (
  <div className={classNames(styles.riderPageHeader, className)}>
    <AthleteHeader
      img={img}
      firstname={firstname}
      lastname={lastname}
      className="biggest"
    />
    <span className={getRiderInfoClassName()}>
      All-time laps: <strong>{allTime.toLocaleString(locale)}</strong>
    </span>
    <span className={getRiderInfoClassName()}>
      Biggest ride: <strong>{single} laps</strong>
    </span>
  </div>
);

RiderPageHeader.defaultProps = {
  className: '',
};

RiderPageHeader.propTypes = {
  firstname: PropTypes.string.isRequired,
  lastname: PropTypes.string.isRequired,
  img: PropTypes.string.isRequired,
  allTime: PropTypes.number.isRequired,
  single: PropTypes.number.isRequired,
  className: PropTypes.string,
};

export default RiderPageHeader;