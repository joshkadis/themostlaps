import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import Router from 'next/router';
import { stringify } from 'query-string';
import {
  primaryOptions,
  secondaryOptions,
  specialOptions
} from '../config/rankingsOpts';
import { timePartString } from '../utils/dateTimeUtils';
import * as styles from './Layout.css';
import { trackRankingSelector } from '../utils/analytics';

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
    this.handleStateChange = this.handleStateChange.bind(this);
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

  // Track when ranking selection changes
  componentDidUpdate(prevProps, prevState) {
    const stateLabel = this.getStateLabel(this.state);
    if (stateLabel !== this.getStateLabel(prevState)) {
      trackRankingSelector('changeSelection', stateLabel);
    }
  }

  getStateLabel(state) {
    return [
      state.type || null,
      state.year || null,
      state.month ? timePartString(state.month) : null,
    ].filter((item) => !!item).join('|');
  }

  /**
   * Checks for "special" ranking types like 'giro2018'
   */
  getRankingType(initial) {
    if (specialOptions.indexOf(initial) !== -1) {
      return 'special';
    }
    return initial;
  }

  onChangePrimary({ value }) {
    const parts = value.split('.');
    const type = this.getRankingType(parts[0]);
    const newState = {
      type,
      year: ('timePeriod' == parts[0] && parts.length > 1) ?
        parts[1] : null,
      filter: 'special' === type ? parts[0] : null,
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

    this.setState(newState, this.handleStateChange);
  }

  onChangeSecondary(evt) {
    this.setState({
      month: (evt && evt.value) ? evt.value : null,
    }, this.handleStateChange);
  }

  handleStateChange() {
    const { type, year, month, filter } = this.state;

    let pathname = '/ranking';
    if ('timePeriod' === type) {
      pathname = `${pathname}/${year}`;
      if (month) {
        pathname = `${pathname}/${timePartString(month)}`;
      }
    } else if ('special' ===  type) {
      pathname = `${pathname}/${filter}`;
    } else {
      pathname = `${pathname}/${type}`;
    }

    trackRankingSelector('handleStateChange', this.getStateLabel(this.state));
    Router.push(`/ranking?${stringify(this.state)}`, pathname);
  }

  filterPrimaryOptions(year, primaryValue, primaryOptions) {
    if (year) {
      return primaryOptions;
    }
    return primaryOptions.filter(({ value }) => value !== primaryValue);
  }

  render() {
    const { type, year, month } = this.state;
    const primaryValue = `${type}${year ? '.' + year : ''}`;

    return (
      <div className={styles['ranking-selector__container']}>
        <span className={styles['ranking-selector__label']}>Other rankings:</span>
        <div className={styles['ranking-selector__container--selects']}>
          <Select
            className={styles['ranking-selector__select']}
            name="primary"
            onChange={this.onChangePrimary}
            options={this.filterPrimaryOptions(year, primaryValue, primaryOptions)}
            value={primaryValue}
            clearable={false}
            searchable={false}
            autoBlur={true}
          />
          {type === 'timePeriod' && (
            <Select
              className={styles['ranking-selector__select']}
              name="secondary"
              value={month}
              onChange={this.onChangeSecondary}
              options={filterSecondaryOptions(year)}
              searchable={false}
              autoBlur={true}
              ref={(el) => this.secondarySelect = el}
            />
          )}
        </div>
      </div>
    );
  };
}

RankingSelector.propTypes = {
  current: PropTypes.object.isRequired,
};

export default RankingSelector;
