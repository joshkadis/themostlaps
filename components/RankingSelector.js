import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import Router from 'next/router';
import { stringify } from 'query-string';
import classNames from 'classnames';
import Button from './lib/Button';
import { primaryOptions, secondaryOptions } from '../config/rankingsOpts';
import { timePartString } from '../utils/dateTimeUtils';
import * as styles from './RankingSelector.css';

/**
 * If selected year is current year, remove future months from secondaryOptions
 *
 * @param {String} year As numeric string
 * @return {Array}
 */
function filterSecondaryOptions(year) {
  const current = new Date();
  if (parseInt(year, 10) !== current.getFullYear()) {
    return secondaryOptions;
  }

  // Get 1-based month
  const currentMonth = current.getMonth() + 1;
  return secondaryOptions.filter(({ value }) =>
    (value === null || parseInt(value, 10) <= currentMonth));
}

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
    } else {
      // Reset if future month
      const current = new Date();
      if (parseInt(parts[1], 10) === current.getFullYear() &&
        parseInt(this.state.month, 10) > (current.getMonth() + 1)
      ) {
        newState.month = null;
      }
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
      <div className={styles.container}>
        <div className={styles.selectsContainer}>
          <Select
            className={classNames(styles.select, styles.selectPrimary)}
            name="primary"
            onChange={this.onChangePrimary}
            options={primaryOptions}
            value={`${type}${year ? '.' + year : ''}`}
            clearable={false}
            searchable={false}
          />
          {type === 'timePeriod' && (
            <Select
              className={classNames(styles.select, styles.selectSecondary)}
              name="secondary"
              value={month}
              onChange={this.onChangeSecondary}
              options={filterSecondaryOptions(year)}
              clearable={false}
              searchable={false}
            />
          )}
        </div>
        <Button
          className={styles.button}
          onClick={this.onClickButton}
        >
          Go
        </Button>
      </div>
    );
  };
}

RankingSelector.propTypes = {
  current: PropTypes.object.isRequired,
};

export default RankingSelector;
