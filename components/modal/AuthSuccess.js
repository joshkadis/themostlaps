import PropTypes from 'prop-types';
import Link from 'next/link';
import Button from '../lib/Button';
import TweetButton from '../lib/TweetButton';
import FBShareButton from '../lib/FBShareButton';
import * as styles from './AuthSuccess.css';

const AuthSuccess = ({ firstname, allTime, id }) => (
  <div style={{ textAlign: 'left' }}>
    <p style={{ textAlign: 'center' }}>
      <Link href={`/rider?athleteId=${id}`} as={`/rider/${id}`}>
        <Button>View Your Stats</Button>
      </Link>
    </p>
    <p>Way to crush laps, {firstname}! Keep adding your rides to Strava and we'll update your stats automatically.</p>
    <p className={styles.shareLinks}>
      <TweetButton laps={allTime} />
      <FBShareButton />
    </p>
    <p>If you're not busy riding laps, check out <Link href="/ranking"><a>the overall rankings.</a></Link>
    </p>
  </div>
);

AuthSuccess.propTypes = {
  firstname: PropTypes.string.isRequired,
  allTime: PropTypes.number.isRequired,
  id: PropTypes.number.isRequired,
};

export default AuthSuccess;
