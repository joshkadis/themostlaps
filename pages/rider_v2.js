/* global window,localStorage */
import { Component } from 'react';
import PropTypes from 'prop-types';
import Router from 'next/router';

// Components
import Layout from '../components/Layout';
import RiderPageHeader from '../components/RiderPageHeader';
import RiderPageWelcome from '../components/RiderPageWelcome';
import RiderPageUpdated from '../components/RiderPageUpdated';

// Utils
import { APIRequest } from '../utils';
import { defaultLocation } from '../config';

// Error Layouts
import RiderMessage from '../components/layouts/rider/RiderMessage';
import RiderNotFound from '../components/layouts/rider/RiderNotFound';

// Charts
import AllYears from '../components/charts/AllYears';
import SingleYear from '../components/charts/SingleYear';

const NOT_FETCHED_STATUS = 'notFetched';

class RiderPage extends Component {
  static defaultProps = {
    status: NOT_FETCHED_STATUS,
    athlete: {},
    locations: {},
    currentLocation: defaultLocation,
    shouldShowWelcome: false,
    shouldShowUpdated: false,
  };

  static propTypes = {
    athlete: PropTypes.object,
    locations: PropTypes.object,
    pathname: PropTypes.string.isRequired,
    query: PropTypes.object.isRequired,
    currentLocation: PropTypes.string,
    shouldShowWelcome: PropTypes.bool,
    shouldShowUpdated: PropTypes.bool,
    status: PropTypes.string,
  }

  state = {
    showStatsBy: 'byYear',
    showStatsYear: new Date().getFullYear(),
    hasCompareAthlete: false,
    currentLocationStats: {},
    compareAthlete: {},
  }

  constructor(props) {
    super(props);
    const {
      currentLocation,
      pathname,
      query,
    } = props;

    this.state = {
      ...this.state,
      currentLocation,
      pathname,
      query,
      currentLocationStats: this.props.locations[currentLocation],
    };
  }

  static async getInitialProps({ req: { path }, query }) {
    // Basic props from context
    const { athleteId = false, location = defaultLocation } = query;

    const defaultInitialProps = {
      currentLocation: location,
      pathname: path,
      query,
      shouldShowWelcome: typeof query.welcome !== 'undefined' && query.welcome,
      shouldShowUpdated: typeof query.updated !== 'undefined' && query.updated,
      status: NOT_FETCHED_STATUS,
    };

    if (!athleteId) {
      return defaultInitialProps;
    }

    return APIRequest(`/v2/athletes/${athleteId}`, {}, {}) /* ` */
      .then((apiResponse) => {
        if (!Array.isArray(apiResponse) || !apiResponse.length) {
          return defaultInitialProps;
        }

        const {
          athlete,
          status,
          stats: { locations },
        } = apiResponse[0];

        return {
          ...defaultInitialProps,
          athlete,
          locations,
          status,
        };
      });
  }

  navigateToRiderPage = ({ value = '' }) => {
    if (value.length) {
      Router.push(
        `/rider?athleteId=${value}`,
        `/rider/${value}`,
      );
    }
  }

  renderMessage = (msgName) => <RiderMessage
      pathname={this.props.pathname}
      query={this.props.query}
      athlete={this.props.athlete}
      msgName={msgName}
    />;

  renderNotFound = () => <RiderNotFound
      pathname={this.props.pathname}
      query={this.props.query}
    />;

  canRenderAthlete = () => this.props.status === 'ready' || this.props.status === 'ingesting';

  render() {
    const {
      pathname,
      query,
      status,
      athlete,
      shouldShowUpdated,
      shouldShowWelcome,
    } = this.props;

    const {
      currentLocationStats: {
        allTime,
        single,
        byYear: primaryAthleteByYear,
        byMonth: primaryAthleteByMonth,
      },
      showStatsBy,
      showStatsYear,
    } = this.state;

    if (!this.canRenderAthlete()) {
      return this.renderNotFound();
    }
    if (status === 'ingesting') {
      return this.renderMessage('ingesting');
    }
    if (!allTime) {
      return this.renderMessage('noLaps');
    }

    return (
      <Layout
        pathname={pathname}
        query={query}
      >
        {shouldShowWelcome && (
          <RiderPageWelcome
            allTime={allTime}
            firstname={athlete.firstname}
          />
        )}

        {shouldShowUpdated && <RiderPageUpdated />}

        <RiderPageHeader
          firstname={athlete.firstname}
          lastname={athlete.lastname}
          img={athlete.profile}
          allTime={allTime}
          single={single}
        />
        {showStatsBy === 'byYear' && (
          <AllYears
            primaryData={primaryAthleteByYear}
            primaryId={parseInt(query.athleteId, 10)}
          />
        )}
        {showStatsBy === 'byMonth' && (
          <SingleYear
            year={showStatsYear.toString()}
            primaryData={primaryAthleteByMonth[showStatsYear]}
            primaryId={parseInt(query.athleteId, 10)}
          />
        )}
        {this.state.chartRendered && (
          <div style={{ textAlign: 'right' }}>
            <a
              className="strava_link"
              href={`https://www.strava.com/athletes/${query.athleteId}`} /* ` */
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Strava
            </a>
          </div>
        )}
      </Layout>
    );
  }
}

export default RiderPage;
