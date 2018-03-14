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

class Rider extends Component {
  constructor(props) {
    super(props);
    this.onClickTick = this.onClickTick.bind(this);
    this.state = {
      displayYear: 'all',
      compare: [],
    };
  }

  onClickTick({ value }) {
    if ('undefined' === typeof value) {
      return;
    }
    this.setState({ displayYear: value.toString() });
  }

  render() {
    const { pathname, query, stats, athlete } = this.props;
    return (
      <Layout
        pathname={pathname}
        query={query}
      >
        <AthleteHeader
          img={athlete.profile}
          firstname={athlete.firstname}
          lastname={athlete.lastname}
          className="biggest"
        />
        <div className="big">
          <p>All-time laps: <strong>{stats.allTime.toLocaleString(locale)}</strong></p>
          <p>Biggest ride: <strong>{stats.single} laps</strong></p>
        </div>
        {'all' === this.state.displayYear ?
          <SingleAthleteChart
            data={statsForSingleAthleteChart(stats)}
            onClickTick={this.onClickTick}
          /> :
          <SingleAthleteYearChart
            data={statsForSingleAthleteYearChart(this.state.displayYear, stats.data)}
            year={this.state.displayYear}
          />
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
