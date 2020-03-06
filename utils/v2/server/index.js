const _transform = require('lodash/transform');
const _isUndefined = require('lodash/isUndefined');

const filterParamsToLowerCase = (params) => _transform(
  params,
  (acc, val, key) => {
    if (!_isUndefined(val)) {
      acc[key] = val.toLowerCase();
    }
    return acc;
  },
  {},
);

module.exports = {
  filterParamsToLowerCase,
};
