import Link from 'next/link';
import PropTypes from 'prop-types';
import Markdown from 'react-markdown';
import classNames from 'classnames';

import Layout from '../components/Layout';
import pageContent from 'raw-loader!../copy/home.md';
import { getPathnameFromContext, APIRequest } from '../utils';
import * as styles from './index.css';
import * as navStyles from '../components/Navigation.css';
import {
  getMonthKey,
  getYearKey,
} from '../utils/dateTimeUtils';
import { triggerModalOpen } from '../utils/modal';

let layoutEl;

const Index = ({ pathname, query, siteTotals }) => (
  <Layout
    pathname={pathname}
    query={query}
  >
    <Markdown className={styles.content} source={pageContent} />
    <div className={styles.siteTotals}>
      <p>The Most Laps has logged...</p>

      {!!siteTotals[getMonthKey()] &&
        <p className=""><strong>{siteTotals[getMonthKey()]} laps this month.</strong></p>
      }

      {!!siteTotals[getYearKey()] &&
        <p className="big"><strong>{siteTotals[getYearKey()]} laps this year.</strong></p>
      }

      {!!siteTotals.allTime &&
        <p className="bigger"><strong>{siteTotals.allTime} laps all time.</strong></p>
      }

      <button
        className={classNames(navStyles.link, navStyles.ctaLink, styles.ctaLink)}
        onClick={triggerModalOpen}
      >
        Add Your Laps
      </button>
    </div>
  </Layout>
);

Index.getInitialProps = (context) => {
  return APIRequest('/totals')
    .then((siteTotals) => ({
      pathname: getPathnameFromContext(context),
      query: context.query,
      siteTotals,
    }));
};

Index.propTypes = {
  query: PropTypes.object.isRequired,
  pathname: PropTypes.string.isRequired,
  siteTotals: PropTypes.object.isRequired,
};

export default Index;
