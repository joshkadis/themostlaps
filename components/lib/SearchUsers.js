import PropTypes from 'prop-types';
import { Async } from 'react-select';
import { APIRequest } from '../../utils';

/**
 * Fetch list of users for searching
 *
 * @param {Array} skipUsers users to filter from results
 * @return {Promise}
 */
function loadOptions(skipUsers) {
  const defaultResponse = {
    options: [],
    complete: true,
  };

  return APIRequest('/searchUsers', { complete: 1 }, defaultResponse)
    .then(({ complete, options }) => ({
      complete,
      options: options.filter(({ value }) => (skipUsers.indexOf(value) === -1)),
    }));
}

const SearchUsers = ({
  autoBlur,
  autoFocus,
  value,
  allowMultiSelect,
  onChange,
  onBlur,
  wrapperClassName,
  skipUsers,
}) => (
  <div className={wrapperClassName || ''}>
    <Async
      autoBlur={autoBlur}
      autoFocus={autoFocus}
      multi={allowMultiSelect}
      value={value}
      onChange={onChange}
      onBlur={onBlur || null}
      loadOptions={() => loadOptions(skipUsers)}
      placeholder="Search by name or Strava user ID"
    />
  </div>
);

SearchUsers.defaultProps = {
  autoBlur: true,
  autoFocus: false,
  value: 0,
  allowMultiSelect: false,
  wrapperClassName: '',
  skipUsers: [],
  onBlur: false,
};

SearchUsers.propTypes = {
  autoBlur: PropTypes.bool,
  autoFocus: PropTypes.bool,
  value: PropTypes.number,
  allowMultiSelect: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.bool,
  ]),
  wrapperClassName: PropTypes.string,
  skipUsers: PropTypes.array,
};

export default SearchUsers;
