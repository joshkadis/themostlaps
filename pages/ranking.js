import PropTypes from 'prop-types';
import Layout from '../components/Layout';
import { getEnvOrigin } from '../utils/envUtils';
import { getPathnameFromContext, APIRequest } from '../utils';
import { timePartString } from '../utils/dateTimeUtils';

const Ranking = ({ ranking, statsKey, query, pathname }) => (
  <Layout
    pathname={pathname}
    query={query}
  >
    <h1>Ranking</h1>
    {ranking.map(({ _id, athlete, stats }) => (
      <p key={_id}>{`${athlete.firstname} ${athlete.lastname}: ${stats[statsKey]} laps`}</p>
    ))}
  </Layout>
);

Ranking.getInitialProps = async function(context) {
  const { query } = context;
  const queryType = query.type || 'allTime';

  const apiQueryParams = {};
  if ('timePeriod' === queryType) {
    apiQueryParams.filter = query.month ? `_${query.year}_${query.month}` : `_${query.year}`;
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
