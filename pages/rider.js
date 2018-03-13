import PropTypes from 'prop-types';
import Layout from '../components/Layout';
import { getPathnameFromContext, APIRequest } from '../utils';
import * as styles from '../components/Layout.css';

const Rider = ({ pathname, query, stats }) => (
  <Layout
    pathname={pathname}
    query={query}
  >

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
