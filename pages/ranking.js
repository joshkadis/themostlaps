import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Layout from '../components/Layout';
import RankingRow from '../components/RankingRow';
import RankingSelector from '../components/RankingSelector';
import Button from '../components/lib/Button';
import { getPathnameFromContext, APIRequest } from '../utils';
import {
  timePartString,
  getMonthName,
  getMonthKey,
  getYearKey,
} from '../utils/dateTimeUtils';
import * as styles from '../components/Layout.css';
import { rankingPerPage } from '../api/apiConfig';

function getRankingName({ type, year, month }) {
  switch (type) {
    case 'single':
      return 'Single Ride';

    case 'timePeriod':
      return month ? `${getMonthName(parseInt(month, 10))} ${year}` : year;

    case 'allTime':
    default:
      return 'All Time';
  }
}

class Ranking extends Component {
  constructor(props) {
    super(props);
    this.onClickShowMore = this.onClickShowMore.bind(this);
    this.state = {
      ranking: props.ranking,
      nextPage: 2,
      shouldDisableShowMore: (props.ranking.length < rankingPerPage),
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      ranking: nextProps.ranking,
      nextPage: 2,
      shouldDisableShowMore: (nextProps.ranking.length < rankingPerPage),
    });
  }

  onClickShowMore() {
    if (this.state.shouldDisableShowMore) {
      return;
    }

    const { type, params } = this.props.APIQuery;

    APIRequest(`/ranking/${type}`, Object.assign(params, { page: this.state.nextPage }), [])
      .then(({ ranking, statsKey }) => {
        this.setState({
          nextPage: (this.state.nextPage + 1),
          ranking: this.state.ranking.concat(ranking),
          shouldDisableShowMore: ranking.length < rankingPerPage,
        })
      });
  }

  render() {
    const { statsKey, query, pathname } = this.props;
    return (
      <Layout
        pathname={pathname}
        query={query}
      >
        <h1>{getRankingName(query)} Ranking</h1>
        <RankingSelector current={query} />
        {!!this.state.ranking.length ? (
          <div>
            <table className={styles['ranking-row__table']}>
              <tbody>
                {this.state.ranking.map(({ _id, athlete, stats = {} }, idx) => (
                  <RankingRow
                    key={_id}
                    athleteId={_id}
                    rank={(idx + 1)}
                    firstname={athlete.firstname}
                    lastname={athlete.lastname}
                    img={athlete.profile}
                    value={stats[statsKey] || 0}
                  />
                ))}
              </tbody>
            </table>
            {this.props.ranking.length >= rankingPerPage &&
              <div style={{ margin: '1rem 0', textAlign: 'center' }}>
                <Button
                  disabled={this.state.shouldDisableShowMore}
                  onClick={this.onClickShowMore}
                >
                  Show more
                </Button>
              </div>
            }
          </div>
        ) : (
          <p>Sorry, no ranking for this view. 😞</p>
        )}
      </Layout>
    );
  }
}

/**
 * Get query info from Next.js page query for API request
 *
 * @param {Object} pageQuery
 * @return {Object}
 */
function getAPIQuery(pageQuery = {}) {
  // Default to current month ranking
  if (!pageQuery.type) {
    return {
      type: 'timePeriod',
      params: {
        filter: getMonthKey(),
      },
    };
  }

  if ('timePeriod' === pageQuery.type) {
    let filter = getYearKey(pageQuery.year);
    if (pageQuery.month) {
      filter = `${filter}_${timePartString(pageQuery.month)}`;
    }

    return {
      type: 'timePeriod',
      params: {
        filter,
      },
    };
  }

  return {
    type: pageQuery.type,
    params: {},
  };
}

Ranking.getInitialProps = async function(context) {
  let { query } = context;
  // @todo Clean up logic between query and APIQuery, these are basically the same thing
  if (!query.type) {
    const current = new Date();
    query = Object.assign({...query}, {
      type: 'timePeriod',
      year: current.getFullYear().toString(),
      month: (current.getMonth() + 1).toString(),
    });
  }
  const APIQuery = getAPIQuery(query);

  return APIRequest(`/ranking/${APIQuery.type}`, APIQuery.params, [])
    .then(({ ranking, statsKey }) => ({
      pathname: getPathnameFromContext(context),
      query,
      ranking,
      statsKey,
      APIQuery,
    }));
}

Ranking.defaultProps = {
  ranking: [],
  query: {},
  pathname: '/',
}

Ranking.propTypes = {
  ranking: PropTypes.array.isRequired,
  query: PropTypes.object.isRequired,
  pathname: PropTypes.string.isRequired,
  APIQuery: PropTypes.object.isRequired,
};

export default Ranking;
