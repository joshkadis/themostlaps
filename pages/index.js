import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Layout from '../components/Layout';
import { LapPath } from '../components/lib/svg';
import { getPathnameFromContext, APIRequest } from '../utils';
import * as styles from '../components/Layout.css';
import HomePrimary from '../components/home/HomePrimary';

const delays = {
  startup: 1000,
  initTransition: 50,
  transition: 1000, // must match animation-duration in index.css
  one: 0,
  two: 1500,
  three: 3500,
  four: 4500,
  interstitial: 2500,
};

/**
 * Get total time in ms between rendering first set of content
 * and start of rendering second set of content
 */
function getSecondaryDelay({
  initTransition,
  three,
  transition,
  interstitial,
}) {
  return initTransition + three + transition + interstitial;
}

class Index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      content: 'primary',
    };
  }

  componentDidMount() {
    setTimeout(() => {
      if (this.contentContainer) {
        this.contentContainer.innerHtml = '';
      }
      setTimeout(() => {
        this.setState({ content: 'secondary' });
      }, 0);
    }, getSecondaryDelay(delays));
  }

  render() {
    const { pathname, query, siteTotals } = this.props;
    return (
      <Layout
        pathname={pathname}
        query={query}
        style={{ textAlign: 'center' }}
      >
        <div
          className={classNames(
            styles['home__background']
          )}
        >
          <LapPath className={styles['home__background--svg']} />
        </div>

        <div
          ref={(el) => this.contentContainer = el}
        >
          <HomePrimary delays={delays} content={this.state.content} />
        </div>
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
