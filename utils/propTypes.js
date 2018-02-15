const PropTypes = require('prop-types');

module.exports = {
  modalControlsShape: {
    open: PropTypes.func.isRequired,
    close: PropTypes.func.isRequired,
  },
};
