import PropTypes from 'prop-types';
import Layout from '../components/Layout';
import RankingRow from '../components/RankingRow';
import RankingSelector from '../components/RankingSelector';
import { getEnvOrigin } from '../utils/envUtils';
import { getPathnameFromContext, APIRequest } from '../utils';
import { timePartString, getMonthName } from '../utils/dateTimeUtils';
import * as styles from '../components/RankingRow.css';

function getRankingName({ type, year, month }) {
  switch (type) {
    case 'single':
      return 'Single Ride';

    case 'timePeriod':
      return month ? `${getMonthName(month)} ${year}` : year;

    case 'allTime':
    default:
      return 'All Time';
  }
}

const Ranking = ({ ranking, statsKey, query, pathname }) => (
  <Layout
    pathname={pathname}
    query={query}
  >
    <h1>{getRankingName(query)} Ranking</h1>
    <RankingSelector current={query} />
    {!!ranking.length ? (
      <table className={styles.table}>
        <tbody>
          {ranking.map(({ _id, athlete, stats }, idx) => (
            <RankingRow
              key={_id}
              athleteId={_id}
              rank={(idx + 1)}
              firstname={athlete.firstname}
              lastname={athlete.lastname}
              img={athlete.profile}
              value={stats[statsKey]}
            />
          ))}
        </tbody>
      </table>
    ) : (
      <p>Sorry, no ranking for this view. 😞</p>
    )}
  </Layout>
);

Ranking.getInitialProps = async function(context) {
  const { query } = context;
  const queryType = query.type || 'allTime';

  const apiQueryParams = {};
  if ('timePeriod' === queryType) {
    apiQueryParams.filter = query.month ? `_${query.year}_${timePartString(query.month)}` : `_${query.year}`;
  }

  return APIRequest(`/ranking/${queryType}`, apiQueryParams, [])
    .then(({ ranking, statsKey }) => ({
      pathname: getPathnameFromContext(context),
      query: context.query,
      ranking,
      statsKey,
    }));
}

Ranking.defaultProps = {
  ranking: [],
  query: {},
  pathname: '/',
}

Ranking.propTypes = {
  ranking: PropTypes.array.isRequired,
  query: PropTypes.object.isRequired,
  pathname: PropTypes.string.isRequired,
};

export default Ranking;
