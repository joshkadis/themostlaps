import { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';

import {
  getApiQueryPath,
  getPageTitle,
} from '../utils/v2/pages/ranking';
import { APIRequest } from '../utils';
import { timePartString as monthString } from '../utils/dateTimeUtils';
import { defaultLocation } from '../config';
import { rankingPerPage } from '../api/apiConfig';

import Layout from '../components/Layout';
import LocationHero from '../components/pages/ranking/LocationHero';
import RankingTable from '../components/pages/ranking/RankingTable';
import Button from '../components/lib/Button';
import RankingMenu from '../components/pages/ranking/RankingMenu';
import { RankingContext } from '../utils/v2/pages/ranking/rankingContext';

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
    apiQueryPath: PropTypes.string.isRequired,
  };

  state = {
    canShowMore: true,
    nextPage: 2,
  };

  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      pageTitle: getPageTitle(props.reqPrimary, props.reqSecondary),
      rankedAthletes: props.rankedAthletes,
    };
  }

  static async getInitialProps({ query: { params }, asPath }) {
    const defaultDate = new Date();
    const {
      location = defaultLocation,
    } = params;
    // Default to current year+month if no primary request
    let reqPrimary;
    let reqSecondary;
    if (params.reqPrimary) {
      reqPrimary = params.reqPrimary;
      reqSecondary = params.reqSecondary || '';
    } else {
      reqPrimary = defaultDate.getFullYear().toString();
      reqSecondary = monthString(defaultDate.getMonth() + 1);
    }

    const apiQueryPath = getApiQueryPath(reqPrimary, reqSecondary);
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
        apiQueryPath,
      }));
  }

  onClickShowMore = () => {
    const {
      canShowMore,
      nextPage,
      rankedAthletes,
    } = this.state;
    if (!canShowMore) {
      return;
    }
    const {
      location,
      apiQueryPath,
    } = this.props;
    APIRequest(
      apiQueryPath,
      { location, page: nextPage, perPage: rankingPerPage },
      [],
    ).then(({ ranking }) => {
      this.setState({
        nextPage: nextPage + 1,
        rankedAthletes: [...rankedAthletes, ...ranking],
        canShowMore: ranking.length === rankingPerPage,
      });
    });
  }

  render() {
    const {
      location,
      reqPrimary,
      reqSecondary,
      statsKey,
      asPath,
    } = this.props;

    const {
      pageTitle,
      canShowMore,
      rankedAthletes = [],
    } = this.state;
    return (
      <RankingContext.Provider value={{
        location,
        reqPrimary,
        reqSecondary,
      }}>
        <Layout pathname={asPath}>
          <h1>{pageTitle}</h1>
          <LocationHero location={location} />
          <RankingMenu />
          {
            rankedAthletes.length
              ? <Fragment>
                  <RankingTable
                    rankedAthletes={rankedAthletes}
                    statsKey={statsKey}
                  />
                  <div style={{ margin: '1rem 0', textAlign: 'center' }}>
                    <Button
                      disabled={!canShowMore}
                      onClick={this.onClickShowMore}
                    >
                      Show more
                    </Button>
                  </div>
                </Fragment>
              : <p>No ranking for this view.</p>
          }
        </Layout>
      </RankingContext.Provider>
    );
  }
}

export default withRouter(RankingPage);
