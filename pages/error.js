import PropTypes from 'prop-types';
import Link from 'next/link';
import { stringify } from 'querystring';
import Layout from '../components/Layout';

const getErrorMessage = (state, athleteId) => {
  if (state === 2 && athleteId !== 0) {
    return (
      <p>
        We check for new rides automatically to update your stats. You can visit your{' '}
        <Link href={`/rider?${stringify({ athleteId })}`} as={`/rider/${athleteId}`}><a>rider page</a></Link>{' '}
        any time without reconnecting to Strava.
      </p>
    );
  }

  return <p>An error occurred. Please try again later.</p>;
}

const ErrorPage = ({ errorPageState = 1, athleteId = 0 }) => (
  <Layout
    pathname="/error"
    query={{}}
  >
    <h2>{errorPageState === 2 ? 'You\'re already signed up!' : 'Sorry about this. 😞'}</h2>
    {getErrorMessage(errorPageState, athleteId)}
    <p>
      If you think this is something we should know about,{' '}
      please email <a href="mailto:info@themostlaps.com">info@themostlaps.com</a>{' '}
      and let us know what's up. Thanks!
    </p>
  </Layout>
);

ErrorPage.getInitialProps = ({ query }) => {
  const {
    type = 1,
    id = 0,
  } = query;

  return {
    errorPageState: !isNaN(type) ? parseInt(type, 10) : 1,
    athleteId: !isNaN(id) ? parseInt(id, 10) : 0,
  };
};

ErrorPage.propTypes = {
  errorPageState: PropTypes.number.isRequired,
};

export default ErrorPage;
