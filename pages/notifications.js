import PropTypes from 'prop-types';
import Layout from '../components/Layout';
import { notificationsText } from '../config/content';

function getText(success) {
  return success ? notificationsText.success : notificationsText.error;
}

const Notifications = ({ query, success }) => (
  <Layout
    pathname="/notifications"
    query={query}
  >
    <p style={{ textAlign: 'center' }}>{getText(success)}</p>
  </Layout>
);

Notifications.getInitialProps = ({ query }) => (
  { query, success: query.success }
);

Notifications.defaultProps = {
  success: false,
};

Notifications.propTypes = {
  query: PropTypes.object.isRequired,
  success: PropTypes.bool,
};

export default Notifications;
