import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import Router from 'next/router';
import { stringify } from 'query-string';
import { primaryOptions, secondaryOptions } from '../config/rankingsOpts';
import { timePartString } from '../utils/dateTimeUtils';

class RankingSelector extends Component {
  constructor(props) {
    super(props);
    this.onChangePrimary = this.onChangePrimary.bind(this);
    this.onChangeSecondary = this.onChangeSecondary.bind(this);
    this.onClickButton = this.onClickButton.bind(this);
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

  onChangePrimary({ value }) {
    const parts = value.split('.');
    const newState = {
      type: parts[0],
      year: ('timePeriod' == parts[0] && parts.length > 1) ?
        parts[1] : null,
    };

    if ('timePeriod' !== parts[0]) {
      newState.month = null;
    }

    this.setState(newState);
  }

  onChangeSecondary({ value }) {
    this.setState({
      month: value,
    });
  }

  onClickButton() {
    const { type, year, month } = this.state;
    let pathname = `/ranking/${'timePeriod' === type ? year : type}`;
    if ('timePeriod' === type && month) {
      pathname = `${pathname}/${timePartString(month)}`;
    }

    Router.push(`/ranking?${stringify(this.state)}`, pathname);
  }

  render() {
    const { type, year, month } = this.state;

    return (
      <div>
        <Select
          name="primary"
          onChange={this.onChangePrimary}
          options={primaryOptions}
          value={`${type}${year ? '.' + year : ''}`}
          clearable={false}
          searchable={false}
        />

        {type === 'timePeriod' && <Select
          name="secondary"
          value={month}
          onChange={this.onChangeSecondary}
          options={secondaryOptions}
          clearable={false}
          searchable={false}
        />}

        <button onClick={this.onClickButton}>
          Go
        </button>
      </div>
    );
  };
}

RankingSelector.propTypes = {
  current: PropTypes.object.isRequired,
};

export default RankingSelector;
