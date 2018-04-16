import PropTypes from 'prop-types';
import Layout from '../components/Layout';
import getErrorMessage from '../utils/internalErrors';

const ErrorPage = ({ query, errorCode }) => (
  <Layout
    pathname="/error"
    query={query}
  >
    <h2 style={{ textAlign: 'center' }}>Sorry about this.</h2>
    <p style={{ textAlign: 'center' }}>
      {getErrorMessage(errorCode)}
    </p>
  </Layout>
);

ErrorPage.propTypes = {
  query: PropTypes.object.isRequired,
  errorCode: PropTypes.number.isRequired,
};

export default ErrorPage;
