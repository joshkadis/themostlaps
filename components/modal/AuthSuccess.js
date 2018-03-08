import PropTypes from 'prop-types';
import Link from 'next/link';
import TweetButton from '../lib/TweetButton';
import FBShareButton from '../lib/FBShareButton';
import * as styles from './AuthSuccess.css';

const AuthSuccess = ({ firstname, allTime }) => (
  <div style={{ textAlign: 'left' }}>
    <p>Nice work, {firstname}! Want to tell your friends?</p>
    <p className={styles.shareLinks}>
      <TweetButton laps={allTime} />
      <FBShareButton />
    </p>
    <p>If you're looking for something else to do (other than riding more laps),
      &nbsp;<Link href="/ranking"><a>check out the rankings.</a></Link></p>
    <p><em>PS – Keep adding your rides to Strava and we'll update your stats automatically.</em></p>
  </div>
);

AuthSuccess.propTypes = {
  firstname: PropTypes.string.isRequired,
  allTime: PropTypes.number.isRequired,
};

export default AuthSuccess;
