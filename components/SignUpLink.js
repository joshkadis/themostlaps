import React, { Component } from 'react';
import * as styles from './SignUpLink.css';
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

export default ({ className }) => (
  <a
    className={className || ''}
    href={getSignupLinkUrl()}
  >
    <img
      className={styles.connectButton}
      src="/static/btn_strava_connectwith_orange@2x.png"
      alt="Connect with Strava"
    />
  </a>
);
