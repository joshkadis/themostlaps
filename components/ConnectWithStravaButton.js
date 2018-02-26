import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { stringify } from 'query-string';
import * as styles from './ConnectWithStravaButton.css';
import { stravaClientId } from '../config';
import { getEnvOrigin } from '../utils/envUtils';

function getStravaAuthUrl(pathname = '/', shouldSubscribe = false) {
  const params = {
    client_id: stravaClientId,
    response_type: 'code',
    scope: 'view_private',
    redirect_uri: getEnvOrigin() + '/auth-callback',
    state: pathname + (shouldSubscribe ? '|shouldSubscribe' : ''),
  };

  return 'https://www.strava.com/oauth/authorize?' + stringify(params);
}

const ConnectWithStravaButton = ({ className, pathname, shouldSubscribe }) => (
  <a
    className={className}
    href={getStravaAuthUrl(pathname, shouldSubscribe)}
  >
    <img
      className={styles.connectButton}
      src="/static/img/btn_strava_connectwith_orange@2x.png"
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
  shouldSubscribe: PropTypes.bool.isRequired,
};

export default ConnectWithStravaButton;
