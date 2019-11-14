/* global process, window,localStorage */
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
const DEFAULT_COMPARE_ATHLETE_STATE = {
  hasCompareAthlete: false,
  compareAthlete: {},
};

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
    chartRendered: false,
    showStatsBy: 'byYear',
    showStatsYear: new Date().getFullYear(),
    currentLocationStats: {},
    ...DEFAULT_COMPARE_ATHLETE_STATE,
  }

  constructor(props) {
    super(props);
    const {
      locations,
      currentLocation,
    } = props;

    this.state = {
      ...this.state,
      currentLocation,
      currentLocationStats: locations[currentLocation],
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

  onChartRendered = () => {
    this.setState({ chartRendered: true });
  }

  onSelectYear = ({ value }) => {
    this.setState({
      showStatsBy: 'byMonth',
      showStatsYear: value,
    });
  }

  /**
   * Handle change in search/select field for user to compare to
   */
  onChangeSearchUsers = (evt) => {
    if (!evt || !evt.value) {
      this.setState(DEFAULT_COMPARE_ATHLETE_STATE);
      return;
    }

    if (evt.value === this.state.compareAthlete.id) {
      return;
    }

    APIRequest(`/v2/athletes/${evt.value}`)
      .then((apiResponse) => {
        if (!Array.isArray(apiResponse) || !apiResponse.length) {
          this.setState(DEFAULT_COMPARE_ATHLETE_STATE);
        }
        this.setState({
          hasCompareAthlete: true,
          compareAthlete: {
            athlete: apiResponse[0].athlete,
            stats: apiResponse[0].stats,
          },
        });
      });
  }

  /**
   * Get compare athlete's stats for location and year
   *
   * @return {Object}
   */
  getCompareAthleteStats = () => {
    const {
      hasCompareAthlete,
      compareAthlete,
      currentLocation,
      showStatsYear,
    } = this.state;

    if (!hasCompareAthlete) {
      return {
        compareAthleteByYear: [],
        compareAthleteByMonth: [],
      };
    }

    // Default values are empty arrays.
    const {
      byYear = [],
      byMonth = {
        [showStatsYear]: [],
      },
    } = compareAthlete.stats.locations[currentLocation];
    return {
      compareAthleteByYear: byYear,
      compareAthleteByMonth: byMonth[showStatsYear],
    };
  }

  /**
   * Increment or decrement current state year
   *
   * @param {Bool} shouldIncrement `true` to increment, `false` to decrement
   */
  updateYear(shouldIncrement) {
    if (this.state.showStatsBy !== 'byMonth') {
      return;
    }
    const { availableYears } = this.state.currentLocationStats;
    // Cast current year as int
    const showStatsYear = parseInt(this.state.showStatsYear, 10);
    const showIdx = availableYears.indexOf(showStatsYear);

    const firstYear = [...availableYears].shift();
    const lastYear = [...availableYears].pop();

    if (shouldIncrement && showStatsYear !== lastYear) {
      this.setState({ showStatsYear: availableYears[showIdx + 1] });
    } else if (!shouldIncrement && showStatsYear !== firstYear) {
      this.setState({ showStatsYear: availableYears[showIdx - 1] });
    }
  }

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
      hasCompareAthlete,
      compareAthlete,
    } = this.state;

    const compareAthleteMeta = compareAthlete.athlete;
    const {
      compareAthleteByYear,
      compareAthleteByMonth,
    } = this.getCompareAthleteStats();

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
            compareTo={compareAthleteMeta}
            compareData={compareAthleteByYear}
            hasCompare={hasCompareAthlete}
            onClickTick={this.onSelectYear}
            onChange={this.onChangeSearchUsers}
            onChartRendered={this.onChartRendered}
            primaryData={primaryAthleteByYear}
            primaryId={parseInt(query.athleteId, 10)}
          />
        )}
        {showStatsBy === 'byMonth' && (
          <SingleYear
            year={showStatsYear}
            primaryData={primaryAthleteByMonth[showStatsYear]}
            primaryId={parseInt(query.athleteId, 10)}
            compareTo={compareAthleteMeta}
            compareData={compareAthleteByMonth}
            hasCompare={hasCompareAthlete}
            onChange={this.onChangeSearchUsers}
            onChartRendered={this.onChartRendered}
            onClickBack={() => this.setState({ showStatsBy: 'byYear' })}
            onClickPrevYear={() => this.updateYear(false)}
            onClickNextYear={() => this.updateYear(true)}
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
        {process.env.APP_VERSION && (
          <div style={{ textAlign: 'right' }}>
            <span className="version-link">{` ${process.env.APP_VERSION}`}</span>{/* ` */}
          </div>
        )}
      </Layout>
    );
  }
}

export default RiderPage;
