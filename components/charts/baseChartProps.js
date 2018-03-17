const PropTypes = require('prop-types');

module.exports = {
  baseChartPropTypes: {
    compareTo: PropTypes.object, // Athlete metadata object
    compareData: PropTypes.array, // Compare athlete's data
    hasCompare: PropTypes.bool.isRequired, // Compare athlete ID !== 0
    primaryData: PropTypes.array.isRequired, // Athlete whose page we're looking at
    onChange: PropTypes.func.isRequired,
  },
  baseChartDefaultProps: {
    compareTo: {},
    compareData: [],
  },
};
