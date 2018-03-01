import PropTypes from 'prop-types';
import Link from 'next/link';

function renderSubscribeForm(email) {
  return <input value={decodeURIComponent(email)} type="email" />;
}

const AuthSuccess = ({ id, email, firstname, allTime }) => (
  <div>
    <h2>🎉{allTime} laps!🎉</h2>
    <p>Thanks for signing up, {firstname}. Next, you can...</p>
    <p>Read <Link href="/about"><a>about</a></Link> how this thing works and what data we store.</p>
    <p>Check out <Link href={`/athlete?id=${id}`} as={`/rider/${id}`}><a>your full stats page</a></Link>.</p>
    <p>Crush laps</p>
    <p>Upload them to Strava</p>
    <p>We'll pull in your rides and update your stats automatically every night.</p>
  </div>
);

AuthSuccess.propTypes = {
  id: PropTypes.number.isRequired,
  firstname: PropTypes.string.isRequired,
  allTime: PropTypes.number.isRequired,
};

export default AuthSuccess;
