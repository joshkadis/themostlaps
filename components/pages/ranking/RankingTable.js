import PropTypes from 'prop-types';
import RankingRow from '../../RankingRow';
import * as styles from '../../Layout.css';

const RankingTable = ({
  rankedAthletes,
  statsKey,
}) => (<table className={styles['ranking-row__table']}>
  <tbody>
    {rankedAthletes.map(({ _id, athlete, stats = {} }, idx) => (
      <RankingRow
        key={_id}
        athleteId={_id}
        rank={(idx + 1)}
        firstname={athlete.firstname}
        lastname={athlete.lastname}
        img={athlete.profile}
        value={stats[statsKey] || 0}
        unit={statsKey.toLowerCase() === 'numactivities' ? 'ride' : 'lap'}
      />
    ))}
  </tbody>
</table>);

RankingTable.propTypes = {
  rankedAthletes: PropTypes.array.isRequired,
  statsKey: PropTypes.string.isRequired,
};

export default RankingTable;
