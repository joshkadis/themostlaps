import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Layout from '../components/Layout';
import { getPathnameFromContext, APIRequest } from '../utils';
import AthleteHeader from '../components/lib/AthleteHeader';
import { locale } from '../config';
import * as styles from '../components/Layout.css';
import {
  statsForAthletePage,
  statsForSingleAthleteChart,
  statsForSingleAthleteYearChart,
} from '../utils/athleteStatsClient';
import SingleAthleteChart from '../components/charts/SingleAthlete';
import SingleAthleteYearChart from '../components/charts/SingleAthleteYear';
import SearchUsers from '../components/lib/SearchUsers';

class Rider extends Component {
  constructor(props) {
    super(props);
    this.onClickTick = this.onClickTick.bind(this);
    this.canNavigateToYear = this.canNavigateToYear.bind(this);
    this.changeYear = this.changeYear.bind(this);
    this.onChangeSearchUsers = this.onChangeSearchUsers.bind(this);
    this.state = {
      displayYear: 'all',
      compare: 0,
    };
  }

  onClickTick({ value }) {
    if ('undefined' === typeof value) {
      return;
    }
    this.setState({ displayYear: value.toString() });
  }

  canNavigateToYear(direction) {
    const compareToYear = direction === 'next' ?
      [...this.props.stats.years].pop() :
      [...this.props.stats.years].shift();
    return this.state.displayYear !== compareToYear;
  }

  changeYear(evt, incr) {
    if ('all' === incr) {
      this.setState({ displayYear: incr });
      return;
    }

    evt.preventDefault();
    if (isNaN(this.state.displayYear)) {
      return;
    }

    const targetYear = (parseInt(this.state.displayYear, 10) + incr).toString();
    if (-1 !== this.props.stats.years.indexOf(targetYear)) {
      this.setState({ displayYear: targetYear });
    }
  }

  onChangeSearchUsers(selection) {
    const compare = selection && selection.value ? selection.value : 0;
    this.setState({ compare });
  }

  render() {
    const { pathname, query, stats, athlete } = this.props;
    return (
      <Layout
        pathname={pathname}
        query={query}
      >
        <div className={styles.rider__header}>
          <AthleteHeader
            img={athlete.profile}
            firstname={athlete.firstname}
            lastname={athlete.lastname}
            className="biggest"
          />
          <span className={`big ${styles['rider__header--info']}`}>
            All-time laps: <strong>{stats.allTime.toLocaleString(locale)}</strong>
          </span>
          <span className={`big ${styles['rider__header--info']}`}>
            Biggest ride: <strong>{stats.single} laps</strong>
          </span>
        </div>
        {'all' === this.state.displayYear ?
          <SingleAthleteChart
            data={statsForSingleAthleteChart(stats)}
            onClickTick={this.onClickTick}
          /> :
          <SingleAthleteYearChart
            data={statsForSingleAthleteYearChart(this.state.displayYear, stats.data)}
            year={this.state.displayYear}
            onClickPrevYear={this.canNavigateToYear('prev') ? (e) => this.changeYear(e, -1) : false}
            onClickNextYear={this.canNavigateToYear('next') ? (e) => this.changeYear(e, 1) : false}
            onClickBack={(e) => this.changeYear(e, 'all')}
          />
        }
        <div>
          <h3 style={{ textAlign: 'center' }}>Compare to...</h3>
          <SearchUsers
            onChange={this.onChangeSearchUsers}
            value={this.state.compare}
          />
        </div>
      </Layout>
    );
  }
};

Rider.getInitialProps = async function(context) {
  const { query } = context;

  const defaultInitialProps = {
    pathname: getPathnameFromContext(context),
    query,
  };

  if (!query.athleteId) {
    return defaultInitialProps;
  }

  return APIRequest(`/athletes/${query.athleteId}`, {}, {})
    .then((apiResponse) => {
      if (apiResponse.length) {
        return Object.assign(defaultInitialProps, {
          athlete: apiResponse[0].athlete,
          stats: statsForAthletePage(apiResponse[0].stats),
         });
      }
      return defaultInitialProps;
    });
}

Rider.defaultProps = {
  stats: {},
  athlete: {},
  query: {},
  pathname: '/',
}

Rider.propTypes = {
  stats: PropTypes.object.isRequired,
  athlete: PropTypes.object.isRequired,
  query: PropTypes.object.isRequired,
  pathname: PropTypes.string.isRequired,
};

export default Rider;
