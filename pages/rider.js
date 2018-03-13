import PropTypes from 'prop-types';
import Layout from '../components/Layout';
import { getPathnameFromContext, APIRequest } from '../utils';
import AthleteHeader from '../components/lib/AthleteHeader';
import * as styles from '../components/Layout.css';

const Rider = ({ pathname, query, stats, athlete }) => (
  <Layout
    pathname={pathname}
    query={query}
  >
    <AthleteHeader
      img={athlete.profile}
      firstname={athlete.firstname}
      lastname={athlete.lastname}
      style={{
        justifyContent: 'center',
        fontSize: '1.5rem',
      }}
    />
  </Layout>
);

Rider.getInitialProps = async function(context) {
  const { query } = context;

  const defaultInitialProps = {
    pathname: getPathnameFromContext(context),
    query,
  };

  if (!query.athleteId) {
    return defaultInitialProps;
  }

  return APIRequest(`/athletes/${query.athleteId}`, {}, {})
    .then((apiResponse) => {
      if (apiResponse.length) {
        return Object.assign(defaultInitialProps, {
          athlete: apiResponse[0].athlete,
          stats: apiResponse[0].stats,
         });
      }
      return defaultInitialProps;
    });
}

Rider.defaultProps = {
  stats: {},
  athlete: {},
  query: {},
  pathname: '/',
}

Rider.propTypes = {
  stats: PropTypes.object.isRequired,
  athlete: PropTypes.object.isRequired,
  query: PropTypes.object.isRequired,
  pathname: PropTypes.string.isRequired,
};

export default Rider;
