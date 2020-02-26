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

class RankingPage extends Component {
  static defaultProps = {
    location: defaultLocation,
    rankedAthletes: [],
  };

  static propTypes = {
    location: PropTypes.string,
    rankedAthletes: PropTypes.array,
    reqPrimary: PropTypes.string.isRequired,
    reqSecondary: PropTypes.string.isRequired,
  };

  state = {};

  constructor(props) {
    super(props);
    this.state = {
      pageTitle: getPageTitle(props.reqPrimary, props.reqSecondary),
    };
  }

  static async getInitialProps({ query }) {
    const defaultDate = new Date();
    const {
      reqPrimary = defaultDate.getFullYear().toString(),
      reqSecondary = monthString(defaultDate.getMonth() + 1),
      location = defaultLocation,
    } = query;

    const apiQueryPath = getApiQueryPath([reqPrimary, reqSecondary]);
    return APIRequest(
      apiQueryPath,
      {
        location,
        ...query,
      },
      [], // @todo Add default response
    )
      .then(({ ranking }) => ({
        rankedAthletes: ranking,
        location,
        reqPrimary,
        reqSecondary,
      }));
  }

  render() {
    const {
      location,
    } = this.props;

    const {
      pageTitle,
    } = this.state;
    return (
      <Layout>
        <h1>{pageTitle}</h1>
        <LocationHero {...location} />
      </Layout>
    );
  }
}

export default withRouter(RankingPage);
