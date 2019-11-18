import PropTypes from 'prop-types';
import Router from 'next/router';
import Layout from '../../Layout';
import SearchUsers from '../../lib/SearchUsers';

const navigateToRiderPage = ({ value = 0 }) => {
  if (parseInt(value, 10) > 0) {
    Router.push(
      `/rider_v2?athleteId=${value}`,
      `/rider/${value}?v2`,
    );
  }
};

const RiderNotFound = ({
  pathname,
  query,
}) => (
  <Layout
    pathname={pathname}
    query={query}
  >
    <h2 style={{ textAlign: 'center' }}>Rider not found 😧</h2>
    <SearchUsers onChange={navigateToRiderPage} />
  </Layout>
);

RiderNotFound.propTypes = {
  pathname: PropTypes.string.isRequired,
  query: PropTypes.object.isRequired,
};

export default RiderNotFound;
