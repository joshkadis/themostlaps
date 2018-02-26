import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as styles from './Layout.css';

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
      { [styles['ranking-row__first']]: rank === 1 }
    )}>
      {rank}
    </td>
    <td className={styles['ranking-row__athlete']}>
      <img className={styles['ranking-row__avatar']} src={img} />
      <span className={styles['ranking-row__name']}>{firstname}&nbsp;{lastname}</span>
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
