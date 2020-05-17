import React from 'react';
import PropTypes from 'prop-types';
import * as styles from './ConnectWithStravaButton.css';
import { trackConnectWithStrava } from '../utils/analytics';
import { getStravaAuthRequestUrl } from '../utils/ingest/utils';

const ConnectWithStravaButton = ({ className, pathname, shouldSubscribe }) => (
  <a
    className={className}
    href={getStravaAuthRequestUrl(pathname, shouldSubscribe)}
    onClick={() => trackConnectWithStrava(shouldSubscribe)}
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
