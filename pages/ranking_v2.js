import { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';

import { getApiQueryPath } from '../utils/v2/pages/ranking';
import { APIRequest } from '../utils';
import { timePartString as monthString } from '../utils/dateTimeUtils';
import { defaultLocation } from '../config';

class RankingPage extends Component {
  static defaultProps = {
    location: defaultLocation,
    rankedAthletes: [],
  };

  static propTypes = {
    location: PropTypes.string,
    rankedAthletes: PropTypes.array,
  };

  state = {

  };

  constructor(props) {
    super(props);
    this.state = {
      rankedAthletes: props.rankedAthletes,
      location: props.location,
    };
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
      }));
  }

  render() {
    return (
      <div>
        <p>{JSON.stringify(this.state)}</p>
        <p>{JSON.stringify(this.props)}</p>
      </div>
    );
  }
}

export default withRouter(RankingPage);
