import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as styles from './ConnectWithStravaButton.css';
import { stravaClientId } from '../config';
import { getEnvOrigin } from '../utils/envUtils';

function getStravaAuthUrl(pathname = '/') {
  const params = [
    `client_id=${stravaClientId}`,
    'response_type=code',
    'scope=view_private',
    `redirect_uri=${encodeURIComponent(getEnvOrigin() + '/auth-callback')}`,
    `state=${encodeURIComponent(pathname)}`,
  ];

  return 'https://www.strava.com/oauth/authorize?' + params.join('&');
}

const ConnectWithStravaButton = ({ className, pathname }) => (
  <a
    className={className}
    href={getStravaAuthUrl(pathname)}
  >
    <img
      className={styles.connectButton}
      src="/static/btn_strava_connectwith_orange@2x.png"
      alt="Connect with Strava"
    />
  </a>
);

ConnectWithStravaButton.defaultProps = {
  className: '',
};

ConnectWithStravaButton.propTypes = {
  className: PropTypes.string.isRequired,
  pathname: PropTypes.string.isRequired,
};

export default ConnectWithStravaButton;
