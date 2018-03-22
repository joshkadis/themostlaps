import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Router from 'next/router';
import Layout from '../components/Layout';
import { getPathnameFromContext, APIRequest } from '../utils';
import RiderPageHeader from '../components/RiderPageHeader';
import SearchUsers from '../components/lib/SearchUsers';
import * as styles from '../components/Layout.css';
import {
  statsForAthletePage,
  statsForSingleAthleteChart,
  statsForSingleAthleteYearChart,
} from '../utils/athleteStatsClient';
import AllYears from '../components/charts/AllYears';
import SingleYear from '../components/charts/SingleYear';

function getCompareTo({ compareToId, compareAthlete }) {
  if (!compareToId || !compareAthlete.athlete) {
    return { id: compareToId };
  }

  return Object.assign(compareAthlete.athlete, {
    id: compareToId,
    allTime: compareAthlete.stats.allTime,
    single: compareAthlete.stats.single
  });
}

class Rider extends Component {
  constructor(props) {
    super(props);
    this.onChangeSearchUsers = this.onChangeSearchUsers.bind(this);
    this.onSelectYear = this.onSelectYear.bind(this);
    this.canGoToYear = this.canGoToYear.bind(this);
    this.goToYear = this.goToYear.bind(this);
    this.onChartRendered = this.onChartRendered.bind(this);

    this.defaultCompareTo = {
      compareAthlete: {},
      compareData: [],
      compareToId: 0,
    }

    this.defaultState = Object.assign({...this.defaultCompareTo}, {
      primaryData: props.stats.data ? statsForSingleAthleteChart(props.stats.data) : [],
      year: 'all',
      chartRendered: false,
    });

    this.state = this.defaultState;
  }

  componentWillReceiveProps(nextProps) {
    // Reset state to defaults when athlete changes
    if (this.props.query.athleteId !== nextProps.query.athleteId) {
      this.setState(Object.assign({...this.defaultState}, {
        primaryData: statsForSingleAthleteChart(nextProps.stats.data),
        chartRendered: true,
      }));
    }
  }

  onChartRendered() {
    this.setState({ chartRendered: true });
  }

 /**
  * Determine if next or prev year is inside data range for main user
  *
  * @param {Bool} shouldIncrement `true` to increment, `false` to decrement
  * @{return} Bool
  */
  canGoToYear(shouldIncrement) {
    const compareToYear = shouldIncrement ?
      [...this.props.stats.years].pop() :
      [...this.props.stats.years].shift();

    // Loose check because we have numeric strings
    return this.state.year != compareToYear;
  }

  /**
   * Increment or decrement current state year
   *
   * @param {Bool} shouldIncrement `true` to increment, `false` to decrement
   */
  goToYear(shouldIncrement) {
    const currentYear = parseInt(this.state.year, 10);
    let toYear = null;

    if (shouldIncrement && this.canGoToYear(true)) {
      toYear = (currentYear + 1);
    } else if (!shouldIncrement && this.canGoToYear(false)) {
      toYear = (currentYear - 1);
    }

    if(toYear) {
      this.onSelectYear(toYear.toString());
    }
  }

  /**
   * Pass year directly or in recharts handler like { value: year }
   *
   * @param {String|Number|Object} year
   */
  onSelectYear(year) {
    if ('undefined' === typeof year || !year) {
      return;
    }

    year = !!year.value ? year.value.toString() : year.toString();

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

  /**
   * Handle change in search/select field for user to compare to
   */
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

  navigateToRiderPage(selection) {
    if (selection && selection.value) {
      Router.push(
        `/rider?athleteId=${selection.value}`,
        `/rider/${selection.value}`,
      );
    }
  }

  render() {
    const { pathname, query, stats, athlete } = this.props;

    // Athlete not found, would have returned a 404 if server-rendered
    if (!Object.keys(athlete).length) {
      return <Layout
        pathname={pathname}
        query={query}
      >
        <h2 style={{ textAlign: 'center' }}>Rider not found 😧</h2>
        <SearchUsers onChange={this.navigateToRiderPage} />
      </Layout>;
    }

    return (
      <Layout
        pathname={pathname}
        query={query}
      >
        <RiderPageHeader
          firstname={athlete.firstname}
          lastname={athlete.lastname}
          img={athlete.profile}
          allTime={stats.allTime}
          single={stats.single}
        />

        {'all' === this.state.year ?
          <AllYears
            compareTo={getCompareTo(this.state)}
            compareData={this.state.compareData || []}
            hasCompare={(0 !== this.state.compareToId)}
            primaryData={this.state.primaryData}
            onClickTick={this.onSelectYear}
            onChange={this.onChangeSearchUsers}
            primaryId={parseInt(query.athleteId, 10)}
            onChartRendered={this.onChartRendered}
          /> :
          <SingleYear
            compareTo={getCompareTo(this.state)}
            compareData={this.state.compareData || []}
            hasCompare={(0 !== this.state.compareToId)}
            primaryData={this.state.primaryData}
            year={this.state.year}
            onClickPrevYear={this.canGoToYear(false) ? () => this.goToYear(false) : false}
            onClickNextYear={this.canGoToYear(true) ? () => this.goToYear(true) : false}
            onClickBack={() => this.onSelectYear('all')}
            onChange={this.onChangeSearchUsers}
            onChartRendered={this.onChartRendered}
          />
        }
        {this.state.chartRendered &&
          <div style={{ textAlign: 'right'}}>
            <a
              className="strava_link"
              href={`https://www.strava.com/athletes/${query.athleteId}`}
              target="_blank"
            >
              View on Strava
            </a>
          </div>
        }
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
