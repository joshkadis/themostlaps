import Link from 'next/link';
import Layout from '../components/Layout';
import { stravaClientId } from '../config';
import { getEnvOrigin } from '../utils/envUtils';

function getSignupLinkUrl() {
  const params = [
    `client_id=${stravaClientId}`,
    'response_type=code',
    'scope=view_private',
    `redirect_uri=${encodeURIComponent(getEnvOrigin() + '/auth-callback')}`,
    'state=signup',
  ];

  return 'https://www.strava.com/oauth/authorize?' + params.join('&');
}

export default () => (
  <Layout>
    <p>lorem ipsum</p>
    <p>
      <a href={getSignupLinkUrl()}>Sign Up</a>
    </p>
  </Layout>
);
