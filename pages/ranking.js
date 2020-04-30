import { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

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
    console.log('constructor', props);
    super(props);
    this.state = {
      ...this.state,
      pageTitle: getPageTitle(props.reqPrimary, props.reqSecondary),
      rankedAthletes: props.rankedAthletes,
    };
  }

  // @todo attach to routeChangeComplete
  componentDidUpdate(prevProps) {
    const {
      location,
      reqPrimary,
      reqSecondary,
      rankedAthletes,
    } = this.props;
    const routeDidChange = !(
      location === prevProps.location
      && reqPrimary === prevProps.reqPrimary
      && reqSecondary === prevProps.reqSecondary
    );

    if (routeDidChange) {
      this.setState({
        pageTitle: getPageTitle(reqPrimary, reqSecondary),
        rankedAthletes,
      });
    }
  }

  static async getInitialProps(context) {
    console.log('getInitialProps', context);
    const { query, asPath } = context;
    const defaultDate = new Date();
    const {
      location = defaultLocation,
      reqPrimary: receivedPrimary = '',
      reqSecondary: receivedSecondary = '',
    } = query;
    // Default to current year+month if no primary request
    let reqPrimary;
    let reqSecondary;
    if (receivedPrimary) {
      reqPrimary = receivedPrimary;
      reqSecondary = receivedSecondary ? monthString(receivedSecondary) : '';
    } else {
      reqPrimary = defaultDate.getFullYear().toString();
      reqSecondary = monthString(defaultDate.getMonth() + 1);
    }

    // @todo Redirect to 404 if request params are invalid

    const apiQueryPath = getApiQueryPath(reqPrimary, reqSecondary);
    return APIRequest(
      apiQueryPath,
      { location },
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
          <LocationHero location={location} />
          <h1>{pageTitle}</h1>
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

export default RankingPage;
