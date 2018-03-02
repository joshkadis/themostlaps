import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Layout from '../components/Layout';
import { LapPath } from '../components/lib/svg';
import { getPathnameFromContext, APIRequest } from '../utils';
import * as styles from '../components/Layout.css';
import HomeContent from '../components/HomeContent';

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
 * Get total delay time as sum of list of keys from delays object
 */
function getDelay(...args) {
  return args.reduce((acc, key) => (acc + (delays[key] || 0)), 0);
}

class Index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      contentMode: 'primary',
      shouldShowContent: false,
    };
  }

  componentDidMount() {
    // Fade in primary content
    setTimeout(() => {
      this.setState({ shouldShowContent: true });
    }, delays.startup)

    // Fade out primary content
    setTimeout(() => {
      this.setState({ shouldShowContent: false });

      // Fade in second content
      setTimeout(() => {
        this.setState({
          contentMode: 'secondary',
          shouldShowContent: true,
        });
      }, getDelay('transition', 'startup', 'initTransition'))
    }, getDelay('initTransition', 'three', 'transition', 'interstitial'))
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
          <HomeContent
            delays={delays}
            contentMode={this.state.contentMode}
            isVisible={this.state.shouldShowContent}
          />
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
