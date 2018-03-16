import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Layout from '../components/Layout';
import { getPathnameFromContext, APIRequest } from '../utils';
import AthleteHeader from '../components/lib/AthleteHeader';
import { locale } from '../config';
import * as styles from '../components/Layout.css';
import SearchUsers from '../components/lib/SearchUsers';
import {
  statsForAthletePage,
  statsForSingleAthleteChart,
  statsForSingleAthleteYearChart,
} from '../utils/athleteStatsClient';

class Rider extends Component {
  constructor(props) {
    super(props);
    this.onChangeSearchUsers = this.onChangeSearchUsers.bind(this);
    this.onChangeYear = this.onChangeYear.bind(this);

    this.defaultCompareTo = {
      compareAthlete: {},
      compareData: [],
      compareToId: 0,
    }

    this.state = Object.assign(this.defaultCompareTo, {
      primaryData: statsForSingleAthleteChart(props.stats.data),
      year: 'all',
    });
  }

  onChangeYear(year) {
    year = year.toString();

    const primaryData = 'all' === year ?
      statsForSingleAthleteChart(this.props.stats.data) :
      statsForSingleAthleteYearChart(year, this.props.stats.data);

    const newState = { year, primaryData };

    if (this.state.compareToId > 0) {
      newState.compareData = 'all' === year ?
        statsForSingleAthleteChart(this.state.compareAthlete.stats.data) :
        statsForSingleAthleteYearChart(year, this.state.compareAthlete.stats.data);
    }

    this.setState(newState);
  }

  onChangeSearchUsers(evt) {
    if (!evt || !evt.value) {
      this.setState(this.defaultCompareTo);
      return;
    }

    if (evt.value === this.state.compareToId) {
      return;
    }

    APIRequest(`/athletes/${evt.value}`)
      .then((apiResponse) => {
        if (apiResponse.length) {
          return {
            athlete: apiResponse[0].athlete,
            stats: statsForAthletePage(apiResponse[0].stats),
          };
        }
        return false
      })
      .then((athleteData) => {
        if (!athleteData) {
          return;
        }
        const compareData = 'all' === this.state.year ?
          statsForSingleAthleteChart(athleteData.stats.data) :
          statsForSingleAthleteYearChart(this.state.year, athleteData.stats.data);

        this.setState({
          compareAthlete: athleteData,
          compareData,
          compareToId: evt.value,
        });
      })
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

        <div>
          <h3 style={{ textAlign: 'center' }}>Compare to...</h3>
          <SearchUsers
            onChange={this.onChangeSearchUsers}
            value={this.state.compareToId}
          />
        </div>
        <div>
          {['all', 2013, 2014, 2015, 2016, 2017, 2018].map((year) => (
            <button key={year} onClick={() => this.onChangeYear(year.toString())}>
              {year}
            </button>
          ))}
        </div>
        <div>
          <h3>State</h3>
          <pre>{JSON.stringify(this.state, null, 4)}</pre>
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
