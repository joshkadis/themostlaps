import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as styles from './RankingRow.css';

const RankingRow = ({
  athleteId,
  rank,
  firstname,
  lastname,
  img,
  value ,
}) => (
  <tr className="big">
    <td className={classNames(
      { biggest: rank === 1, bigger: rank !== 1 },
      { [styles.first]: rank === 1 }
    )}>
      {rank}
    </td>
    <td className={styles.athleteCell}>
      <img className={styles.avatar} src={img} />
      <span className={styles.name}>{firstname}&nbsp;{lastname}</span>
    </td>
    <td>{value} lap{value === 1 ? '' : 's'}</td>
  </tr>
);

RankingRow.propTypes = {
  athleteId: PropTypes.number.isRequired,
  rank: PropTypes.number.isRequired,
  firstname: PropTypes.string.isRequired,
  lastname: PropTypes.string.isRequired,
  img: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
};

export default RankingRow;
