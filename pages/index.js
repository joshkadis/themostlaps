import Link from 'next/link';
import PropTypes from 'prop-types';
import Markdown from 'react-markdown';
import classNames from 'classnames';
import Layout from '../components/Layout';
import Button from '../components/lib/Button';
import pageContent from 'raw-loader!../copy/home.md';
import { getPathnameFromContext, APIRequest } from '../utils';
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
    style={{ textAlign: 'center' }}
  >
    <Markdown source={pageContent} />
    <div>
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

      <Button
        onClick={triggerModalOpen}
        style={{
          marginTop: '1rem',
          fontSize: '1.25rem',
          padding: '0.7rem',
          letterSpacing: '1px',
        }}
      >
        Add Your Laps
      </Button>
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
