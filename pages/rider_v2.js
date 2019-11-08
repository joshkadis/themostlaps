/* global window,localStorage */
import { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import Layout from '../components/Layout';
import RiderPageHeader from '../components/RiderPageHeader';
import { APIRequest } from '../utils';
import { defaultLocation } from '../config';

class RiderPage extends Component {
  defaultProps = {
    showLocation: defaultLocation,
    shouldShowWelcome: false,
    shouldShowUpdated: false,
  };

  propTypes = {
    athlete: PropTypes.object.isRequired,
    showLocation: PropTypes.string,
    locations: PropTypes.object.isRequired,
    pathname: PropTypes.string.isRequired,
    query: PropTypes.object.isRequired,
    shouldShowWelcome: PropTypes.bool,
    shouldShowUpdated: PropTypes.bool,
    status: PropTypes.string.isRequired,
  }

  state = {
    showStatsBy: 'byYear',
    hasCompareAthlete: false,
    compareAthlete: {
      id: 0,
      locations: {},
      athlete: {},
    },
    layoutStyle: {},
  }

  constructor(props) {
    super(props);
    const {
      showLocation,
      pathname,
      query,
    } = props;

    this.state = {
      ...this.state,
      showLocation,
      pathname,
      query,
      currentLocationStats: this.props.locations[showLocation],
    };
  }

  static async getInitialProps({ req: { path }, query }) {
    // Basic props from context
    const { athleteId = false, location = defaultLocation } = query;

    if (!athleteId) {
      // -> 404
    }

    const defaultInitialProps = {
      showLocation: location,
      pathname: path,
      query,
      shouldShowWelcome: typeof query.welcome !== 'undefined' && query.welcome,
      shouldShowUpdated: typeof query.updated !== 'undefined' && query.updated,
    };

    return APIRequest(`/v2/athletes/${athleteId}`, {}, {}) /* ` */
      .then((apiResponse) => {
        if (apiResponse.length) {
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
        }
        // -> 404
        return false;
      });
  }

  render() {
    const {
      firstname,
      lastname,
      profile: img,
    } = this.props.athlete;

    const {
      allTime,
      single,
    } = this.state.currentLocationStats;

    return (
      <Layout>
        <RiderPageHeader
          firstname={firstname}
          lastname={lastname}
          img={img}
          allTime={allTime}
          single={single}
        />
      </Layout>
    );
    // primaryAthlete not found
      // "Sorry!"
      // <SearchUsers>

    // primaryAthlete not ready
      // <RiderPageHeader>

    // primaryAthlete has no laps
      // <RiderPageHeader>
      // "no laps!"

    // primaryAthlete can display
      // <RiderPageWelcome>?
      // <RiderPageHeader>
      // year === 'all'
        // ? <AllYears>
        // : <SingleYear>
      // <StavaLink>
  }
}

export default RiderPage;
