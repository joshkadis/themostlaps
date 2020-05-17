import PropTypes from 'prop-types';
import classNames from 'classnames';
import AthleteHeader from './lib/AthleteHeader';
import * as styles from './Layout.css';
import { locale } from '../config';


const getRiderInfoClassName = () => classNames(
  'big',
  styles.riderPageHeader_info,
);

function RiderPageHeader(props) {
  const {
    firstname,
    lastname,
    img,
    allTime,
    single,
    className,
  } = props;
  return (
    <div className={classNames(styles.riderPageHeader, className)}>
      <AthleteHeader
        img={img}
        firstname={firstname}
        lastname={lastname}
        className={`biggest ${styles.riderPageHeader_athleteHeader}`}
      />

      {allTime > 0 && (
        <span className={getRiderInfoClassName()}>
          All-time laps: <strong>{allTime.toLocaleString(locale)}</strong>
        </span>
      )}

      {single > 0 && (
        <span className={getRiderInfoClassName()}>
          Biggest ride: <strong>{single} laps</strong>
        </span>
      )}
    </div>
  );
}

RiderPageHeader.defaultProps = {
  className: '',
  allTime: 0,
  single: 0,
};

RiderPageHeader.propTypes = {
  firstname: PropTypes.string.isRequired,
  lastname: PropTypes.string.isRequired,
  img: PropTypes.string.isRequired,
  allTime: PropTypes.number,
  single: PropTypes.number,
  className: PropTypes.string,
};

export default RiderPageHeader;
