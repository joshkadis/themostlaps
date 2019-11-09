/* global window,localStorage */
import { Component } from 'react';
import PropTypes from 'prop-types';
import Router from 'next/router';

// Components
import Layout from '../components/Layout';
import SearchUsers from '../components/lib/SearchUsers';
import RiderPageHeader from '../components/RiderPageHeader';

// Utils
import { APIRequest } from '../utils';
import { defaultLocation } from '../config';

const NOT_FETCHED_STATUS = 'notFetched';
const RIDER_MESSAGES = {
  ingesting: 'Compiling your stats. Please check back in a minute.',
  noLaps: 'Not even one lap, ever! 😱',
  defaultMsg: 'An error occurred',
};

class RiderPage extends Component {
  defaultProps = {
    status: NOT_FETCHED_STATUS,
    athlete: {},
    locations: {},
    currentLocation: defaultLocation,
    shouldShowWelcome: false,
    shouldShowUpdated: false,
  };

  propTypes = {
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

  renderMessage(msgName) {
    const {
      pathname,
      query,
      athlete: {
        firstname,
        lastname,
        profile: img,
      },
    } = this.props;

    return (
      <Layout
        pathname={pathname}
        query={query}
      >
        <RiderPageHeader
          firstname={firstname}
          lastname={lastname}
          img={img}
        />
        <h3 style={{ textAlign: 'center' }}>{RIDER_MESSAGES[msgName] || RIDER_MESSAGES.defaultMsg}</h3>
      </Layout>
    );
  }

  renderNotFound() {
    const {
      pathname,
      query,
    } = this.props;

    return (
      <Layout
        pathname={pathname}
        query={query}
      >
        <h2 style={{ textAlign: 'center' }}>Rider not found 😧</h2>
        <SearchUsers onChange={this.navigateToRiderPage} />
      </Layout>
    );
  }

  canRenderAthlete = () => this.props.status === 'ready' || this.props.status === 'ingesting';

  render() {
    const {
      pathname,
      query,
      status,
      athlete,
    } = this.props;

    const {
      allTime,
      single,
    } = this.state.currentLocationStats;

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
        {/* <RiderPageWelcome>? */}
        <RiderPageHeader
          firstname={athlete.firstname}
          lastname={athlete.lastname}
          img={athlete.img}
          allTime={allTime}
          single={single}
        />
        {/* year === 'all' ? <AllYears> : <SingleYear> */}
        {/* StravaLink> */}
      </Layout>
    );
  }
}

export default RiderPage;
