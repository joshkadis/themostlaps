import Link from 'next/link';
import { prodDomain, lapSegmentId } from '../config';

function getSignupLinkUrl() {
  const host = 'production' === process.env.NODE_ENV ?
    `https://${prodDomain}` : 'http://localhost:3000';

  const params = [
    `client_id=${process.env.CLIENT_ID}`,
    'response_type=code',
    'scope=view_private',
    `redirect_uri=${encodeURIComponent(host + '/auth-callback')}`,
    'state=signup',
  ];

  return 'https://www.strava.com/oauth/authorize?' + params.join('&');
}

export default () => (
  <div>
    <p>
      <Link as="/prospectpark" href={`/park?segment=${lapSegmentId}`}>
        <a>Prospect Park</a>
      </Link>
    </p>
    <p>
      <a href={getSignupLinkUrl()}>Sign Up</a>
    </p>
  </div>
);
