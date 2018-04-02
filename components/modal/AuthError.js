import PropTypes from 'prop-types';
import Link from 'next/link';
import getInternalError from '../../utils/internalErrors';

/* @todo Report error button */
const AuthError = ({ code, id }) => (
  <div>
    <p>{getInternalError(code, id)}</p>
    {50 === code && id !== 0 &&
      <p>Visit your <Link href={`/rider?athleteId=${id}`} as={`/rider/${id}`}><a>rider page</a></Link>.</p>
    }
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
