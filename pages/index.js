import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Layout from '../components/Layout';
import Button from '../components/lib/Button';
import { getPathnameFromContext, APIRequest } from '../utils';
import { triggerModalOpen } from '../utils/modal';

class Index extends Component {
  componentDidMount() {
    console.log('MOUNTED');
  }

  componentDidUpdate() {
    console.log('UPDATED');
  }
  render() {
    const { pathname, query, siteTotals } = this.props;
    return (
      <Layout
        pathname={pathname}
        query={query}
        style={{ textAlign: 'center' }}
      >
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
      </Layout>
    );
  }
}

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
