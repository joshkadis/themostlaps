import PropTypes from 'prop-types';
import Link from 'next/link';
import getInternalError from '../../utils/internalErrors';

/* @todo Report error button */
const AuthError = ({ code, id }) => (
  <div>
    <p>{getInternalError(code, id)}</p>
    {50 === code && id !== 0 &&
      <p>We check for new rides automatically to update your stats. You can visit your <Link href={`/rider?athleteId=${id}`} as={`/rider/${id}`}><a>rider page</a></Link> any time without reconnecting to Strava.</p>
    }
    <p>Something not working? Email <a href="mailto:info@themostlaps.com">info@themostlaps.com</a> and let us know what's up.</p>
  </div>
);

AuthError.defaultProps = {
  id: 0,
};

AuthError.propTypes = {
  code: PropTypes.number.isRequired,
  id: PropTypes.number,
};

export default AuthError;
