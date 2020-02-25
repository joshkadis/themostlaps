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

class RankingPage extends Component {
  static defaultProps = {
    location: defaultLocation,
    rankedAthletes: [],
  };

  static propTypes = {
    location: PropTypes.string,
    rankedAthletes: PropTypes.array,
    reqPrimary: PropTypes.string.required,
    reqSecondary: PropTypes.string.required,
  };

  state = {};

  constructor(props) {
    super(props);
    this.state = {
      rankedAthletes: props.rankedAthletes,
      location: props.location,
    };
    this.setPageTitle();
  }

  static async getInitialProps({ query }) {
    const defaultDate = new Date();
    const {
      reqPrimary = defaultDate.getFullYear(),
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

  setPageTitle() {
    const {
      reqPrimary: primary,
      reqSecondary: secondary,
    } = this.props;
    this.setState({
      pageTitle: getPageTitle(primary, secondary),
    });
  }

  render() {
    const {
      pageTitle,
    } = this.state;
    return (
      <Layout>
        <h1>{pageTitle}</h1>
      </Layout>
    );
  }
}

export default withRouter(RankingPage);
