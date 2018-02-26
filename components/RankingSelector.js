import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import rankingsOptions from '../config/rankingsOpts';
import '!style-loader!css-loader!react-select/dist/react-select.css';

class RankingSelector extends Component {
  constructor(props) {
    super(props);
    this.onChangeSelect = this.onChangeSelect.bind(this);
    this.state = {
      type: false,
      year: null,
      month: null,
    }
  }

  componentWillMount() {
    this.setState(this.props.current);
  }

  componentWillReceiveProps({ current }) {
    this.setState(current);
  }

  onChangeSelect(evt) {
    debugger;
  }

  render() {
    const { type, year, month } = this.state;

    return (
      <div>
        <Select
          name="primary"
          value={`${type}${year ? '.' + year : ''}`}
          onChange={this.onChangeSelect}
          options={rankingsOptions}
        />
      </div>
    );
  };
}

RankingSelector.propTypes = {
  current: PropTypes.object.isRequired,
};

export default RankingSelector;
