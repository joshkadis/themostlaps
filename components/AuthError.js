import PropTypes from 'prop-types';
import getInternalError from '../utils/internalErrors';

const AuthError = ({ code }) => (
  <div>
    <h2>Authorization Error</h2>
    <p>{getInternalError(code)}</p>
    {/* @todo Report error button */}
  </div>
);

AuthError.propTypes = {
  code: PropTypes.number.isRequired,
};

export default AuthError;
