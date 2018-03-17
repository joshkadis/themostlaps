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
      options: options.filter(({ value }) => (-1 === skipUsers.indexOf(value))),
    }));
}

const SearchUsers = ({ value, allowMultiSelect, onChange, wrapperClassName, skipUsers }) => (
  <div className={wrapperClassName || ''}>
    <Async
      multi={allowMultiSelect}
      value={value}
      onChange={onChange}
      loadOptions={() => loadOptions(skipUsers)}
      placeholder="Search by name or Strava user ID"
    />
  </div>
);

SearchUsers.defaultProps = {
  value: 0,
  allowMultiSelect: false,
  wrapperClassName: '',
  skipUsers: []
};

SearchUsers.propTypes = {
  value: PropTypes.number,
  allowMultiSelect: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  wrapperClassName: PropTypes.string,
  skipUsers: PropTypes.array,
};

export default SearchUsers;
