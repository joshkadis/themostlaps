import PropTypes from 'prop-types';
import Link from 'next/link';
import TweetButton from '../lib/TweetButton';

const AuthSuccess = ({ firstname, allTime }) => (
  <div style={{ textAlign: 'left' }}>
    <p>Keep adding your rides to Strava and we'll update your stats automatically.</p>
    <p>If you're looking for something to do next (other than riding laps),
      &nbsp;<Link href="/ranking"><a>check out the all-time rankings</a></Link>&nbsp;
      or tell your friends about The Most Laps:
    </p>
    <p>
      <TweetButton laps={allTime} />
    </p>
    <p>PS - Thanks for signing up, {firstname}. We really appreciate it!</p>
  </div>
);

AuthSuccess.propTypes = {
  firstname: PropTypes.string.isRequired,
  allTime: PropTypes.number.isRequired,
};

export default AuthSuccess;
