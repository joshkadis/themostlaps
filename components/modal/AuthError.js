import PropTypes from 'prop-types';
import getInternalError from '../../utils/internalErrors';

/* @todo Report error button */
const AuthError = ({ code }) => (<p>{getInternalError(code)}</p>);

AuthError.propTypes = {
  code: PropTypes.number.isRequired,
};

export default AuthError;
