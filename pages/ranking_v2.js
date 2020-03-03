import { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';

import {
  getApiQueryPath,
  getPageTitle,
} from '../utils/v2/pages/ranking';
import { APIRequest } from '../utils';
import { timePartString as monthString } from '../utils/dateTimeUtils';
import { defaultLocation } from '../config';

import Layout from '../components/Layout';
import LocationHero from '../components/pages/ranking/LocationHero';
import RankingTable from '../components/pages/ranking/RankingTable';

class RankingPage extends Component {
  static defaultProps = {
    location: defaultLocation,
    rankedAthletes: [],
    statsKey: 'allTime',
    asPath: '/prospectpark',
  };

  static propTypes = {
    location: PropTypes.string,
    rankedAthletes: PropTypes.array,
    reqPrimary: PropTypes.string.isRequired,
    reqSecondary: PropTypes.string.isRequired,
    statsKey: PropTypes.string,
    asPath: PropTypes.string,
  };

  state = {};

  constructor(props) {
    super(props);
    this.state = {
      pageTitle: getPageTitle(props.reqPrimary, props.reqSecondary),
    };
  }

  static async getInitialProps({ query: { params }, asPath }) {
    const defaultDate = new Date();
    const {
      reqPrimary = defaultDate.getFullYear().toString(),
      reqSecondary = monthString(defaultDate.getMonth() + 1),
      location = defaultLocation,
    } = params;

    const apiQueryPath = getApiQueryPath([reqPrimary, reqSecondary]);
    return APIRequest(
      apiQueryPath,
      {
        location,
        ...params,
      },
      [], // @todo Add default response
    )
      .then(({ ranking, statsKey }) => ({
        rankedAthletes: ranking,
        location,
        reqPrimary,
        reqSecondary,
        statsKey,
        asPath,
      }));
  }

  render() {
    const {
      location,
      rankedAthletes = [],
      statsKey,
      asPath,
    } = this.props;

    const {
      pageTitle,
    } = this.state;
    return (
      <Layout pathname={asPath}>
        <h1>{pageTitle}</h1>
        <LocationHero location={location} />
        {
          rankedAthletes.length
            ? <RankingTable
                rankedAthletes={rankedAthletes}
                statsKey={statsKey}
              />
            : <p>No ranking for this view.</p>
        }
      </Layout>
    );
  }
}

export default withRouter(RankingPage);
