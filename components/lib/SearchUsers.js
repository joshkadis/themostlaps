import PropTypes from 'prop-types';
import { Async } from 'react-select';
import { APIRequest } from '../../utils';

/**
 * Fetch list of users for searching
 *
 * @return {Promise}
 */
function loadOptions() {
  const defaultResponse = {
    options: [],
    complete: true,
  };
  return APIRequest('/searchUsers', { complete: 1 }, defaultResponse);
}

const SearchUsers = ({ value, allowMultiSelect, onChange, wrapperClassName }) => (
  <div className={wrapperClassName || ''}>
    <Async
      multi={allowMultiSelect}
      value={value}
      onChange={onChange}
      loadOptions={loadOptions}
      placeholder="Search by name or Strava user ID"
    />
  </div>
);

SearchUsers.defaultProps = {
  value: 0,
  allowMultiSelect: false,
  wrapperClassName: '',
};

SearchUsers.propTypes = {
  value: PropTypes.number,
  allowMultiSelect: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  wrapperClassName: PropTypes.string,
};

export default SearchUsers;
