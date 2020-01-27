import { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';

// Components
import Layout from '../components/Layout';
import RiderPageHeader from '../components/RiderPageHeader';
import RiderPageWelcome from '../components/RiderPageWelcome';
import RiderPageMessage from '../components/RiderPageMessage';

// Utils
import { APIRequest } from '../utils';
import { defaultLocation } from '../config';
import { routeIsV2 } from '../utils/v2/router';
import { transformLocationsForRender } from '../utils/v2/stats/transformForRender';
import {
  riderHasLapsAnywhere,
  riderHasStatsForLocation,
} from '../utils/v2/models/athleteHelpersClient';

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

// eslint-disable-next-line arrow-body-style
const getAvailableYears = (locationStats, key) => {
  return locationStats[key]
    ? Object.keys(locationStats[key]).map((yr) => Number(yr)).sort()
    : [];
};

class RiderPage extends Component {
  static defaultProps = {
    status: NOT_FETCHED_STATUS,
    athlete: {},
    locations: {},
    currentLocation: defaultLocation,
    shouldShowWelcome: false,
    shouldShowUpdated: false,
    isDuplicateSignup: false,
  };

  static propTypes = {
    athlete: PropTypes.object,
    locations: PropTypes.object,
    pathname: PropTypes.string.isRequired,
    query: PropTypes.object.isRequired,
    currentLocation: PropTypes.string,
    router: PropTypes.object.isRequired,
    shouldShowWelcome: PropTypes.bool,
    shouldShowUpdated: PropTypes.bool,
    isDuplicateSignup: PropTypes.bool,
    status: PropTypes.string,
  }

  state = {
    chartRendered: false,
    showStatsBy: 'byYear',
    showStatsYear: new Date().getFullYear(),
    ...DEFAULT_COMPARE_ATHLETE_STATE,
  }

  constructor(props) {
    super(props);
    const {
      currentLocation,
      locations,
    } = props;


    this.state = {
      ...this.state,
      currentLocation, // @todo Enable changing location from UI
      yearsForByMonth: getAvailableYears(locations[currentLocation], 'byMonth'),
      yearsForByYear: getAvailableYears(locations[currentLocation], 'byYear'),
    };
  }

  static async getInitialProps({ query, req = {} }) {
    // Basic props from context
    const { athleteId = false, currentLocation = defaultLocation } = query;

    const defaultInitialProps = {
      currentLocation,
      pathname: req.path || `/rider/${athleteId}`,
      query,
      shouldShowWelcome: !!query.welcome,
      shouldShowUpdated: !!query.updated,
      isDuplicateSignup: !!query.ds,
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

        if (apiResponse[0].stats_version === 'v1') {
          this.props.router.push(
            `/rider?athleteId=${athleteId}`,
            `/rider/${athleteId}`,
          );
        }

        const {
          athlete,
          status,
          stats: { locations },
        } = apiResponse[0];

        return {
          ...defaultInitialProps,
          athlete,
          locations: transformLocationsForRender(locations),
          status,
        };
      });
  }

  navigateToRiderPage = ({ value = '' }) => {
    if (value.length) {
      this.props.router.push(
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

  onSelectYear = (selected) => {
    const showStatsYear = selected.value
      ? Number(selected.value)
      : Number(selected);

    if (this.state.yearsForByMonth.indexOf(showStatsYear) === -1) {
      return;
    }

    this.setState({
      showStatsBy: 'byMonth',
      showStatsYear,
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

        if (!riderHasStatsForLocation(
          apiResponse[0].stats,
          this.state.currentLocation,
        )) {
          // @todo Add some message here!
          this.setState(DEFAULT_COMPARE_ATHLETE_STATE);
          return;
        }

        this.setState({
          hasCompareAthlete: true,
          compareAthlete: {
            athlete: apiResponse[0].athlete,
            stats: transformLocationsForRender(apiResponse[0].stats.locations),
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
      compareAthlete = false,
      currentLocation,
      showStatsYear,
    } = this.state;

    let compareLocationStats = false;
    if (compareAthlete
      && compareAthlete.stats
      && compareAthlete.stats[currentLocation]
    ) {
      compareLocationStats = compareAthlete.stats[currentLocation];
    }

    // @todo Message if we're trying to compare an athlete
    // but they don't have stats for this location
    if (!compareLocationStats) {
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
    } = compareLocationStats;
    return {
      compareAthleteByYear: byYear,
      compareAthleteByMonth: byMonth[showStatsYear] || [],
    };
  }

  /**
   * Increment or decrement current state year
   *
   * @param {Bool} shouldIncrement `true` to increment, `false` to decrement
   */
  updateYear(shouldIncrement) {
    const {
      showStatsBy,
      showStatsYear: showStatsYearInState,
      yearsForByMonth,
    } = this.state;

    if (showStatsBy !== 'byMonth') {
      return;
    }

    // Make sure type of current year matches available years
    const showStatsYear = parseInt(showStatsYearInState, 10);

    const showIdx = yearsForByMonth.indexOf(showStatsYear);

    const firstYear = yearsForByMonth[0];
    const lastYear = yearsForByMonth[yearsForByMonth.length - 1];

    if (shouldIncrement && showStatsYear < lastYear) {
      this.setState({
        showStatsYear: yearsForByMonth[showIdx + 1],
      });
    } else if (!shouldIncrement && showStatsYear > firstYear) {
      this.setState({
        showStatsYear: yearsForByMonth[showIdx - 1],
      });
    }
  }

  render() {
    const {
      pathname,
      query,
      status,
      athlete,
      shouldShowWelcome,
      shouldShowUpdated,
      isDuplicateSignup,
      locations = {},
      currentLocation,
      router: routerProp,
    } = this.props;

    const {
      showStatsBy,
      showStatsYear,
      hasCompareAthlete,
      compareAthlete,
      chartRendered,
      yearsForByMonth,
    } = this.state;

    if (!riderHasLapsAnywhere(locations)) {
      return this.renderMessage('noLaps');
    }

    if (!locations[currentLocation]) {
      return this.renderMessage('noLapsLocation');
    }

    const {
      allTime,
      single,
      byYear: primaryAthleteByYear,
      byMonth: primaryAthleteByMonth,
    } = locations[currentLocation];

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

        {(shouldShowUpdated || isDuplicateSignup)
          && (
            <RiderPageMessage
              shouldShowUpdated={shouldShowUpdated}
              isDuplicateSignup={isDuplicateSignup}
            />
          )
        }

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
            availableYears={yearsForByMonth}
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
        {chartRendered && (
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
        {routeIsV2(routerProp) && (
          <div style={{ textAlign: 'right' }}>
            <span className="version-link">v2</span>
          </div>
        )}
      </Layout>
    );
  }
}

export default withRouter(RiderPage);
