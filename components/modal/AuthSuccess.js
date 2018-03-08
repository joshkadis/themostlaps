import PropTypes from 'prop-types';
import Link from 'next/link';
import TweetButton from '../lib/TweetButton';
import FBShareButton from '../lib/FBShareButton';
import * as styles from './AuthSuccess.css';

const AuthSuccess = ({ firstname, allTime }) => (
  <div style={{ textAlign: 'left' }}>
    <p><em>Keep adding your rides to Strava and we'll update your stats automatically.</em></p>
    <p>If you're looking for something to do next (other than riding laps),
      &nbsp;<Link href="/ranking"><a>check out the all-time rankings</a></Link>&nbsp;
      or tell your friends about The Most Laps:
    </p>
    <p className={styles.shareLinks}>
      <TweetButton laps={allTime} />
      <FBShareButton />
    </p>
    <p>PS - Thanks for signing up, {firstname}. We really appreciate it!</p>
  </div>
);

AuthSuccess.propTypes = {
  firstname: PropTypes.string.isRequired,
  allTime: PropTypes.number.isRequired,
};

export default AuthSuccess;
