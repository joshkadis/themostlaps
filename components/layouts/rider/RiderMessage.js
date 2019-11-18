import PropTypes from 'prop-types';
import Layout from '../../Layout';
import RiderPageHeader from '../../RiderPageHeader';

const RIDER_MESSAGES = {
  ingesting: 'Compiling your stats. Please check back in a minute.',
  noLaps: 'Not even one lap, ever! 😱',
  defaultMsg: 'An error occurred',
};

const RiderMessage = ({
  pathname,
  query,
  athlete: {
    firstname,
    lastname,
    profile,
  },
  msgName,
}) => (
  <Layout
    displayName='RiderMessageLayout'
    pathname={pathname}
    query={query}
  >
    <RiderPageHeader
      firstname={firstname}
      lastname={lastname}
      img={profile}
    />
    <h3 style={{ textAlign: 'center' }}>{RIDER_MESSAGES[msgName] || RIDER_MESSAGES.defaultMsg}</h3>
  </Layout>
);

RiderMessage.propTypes = {
  athlete: PropTypes.object.isRequired,
  pathname: PropTypes.string.isRequired,
  query: PropTypes.object.isRequired,
  msgName: PropTypes.string.isRequired,
};

export default RiderMessage;
