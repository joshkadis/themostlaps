import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Layout from '../components/Layout';
import { LapPath } from '../components/lib/svg';
import { getPathnameFromContext, APIRequest } from '../utils';
import * as styles from '../components/Layout.css';
import HomePrimary from '../components/home/HomePrimary';

const delay = {
  startup: 1000,
  transition: 1000, // must match animation-duration in index.css
  one: 0,
  two: 1000,
  three: 3000,
  four: 4500,
  interstitial: 2200,
};

function unhideChildElements(id, useDelay = true) {
  if (typeof document === 'undefined') {
    return;
  }
  document
    .querySelectorAll(`#${id} [data-animated]`)
    .forEach((el) => {
      const attr = el.getAttribute('data-animated');
      const elDelay = (useDelay && attr && delay[attr]) ? delay[attr] : 0;
      setTimeout(() => {
        el.classList.add('home__block--active');
      }, elDelay)
    });
}

/**
 * Insert animated text into DOM after page load
 *
 * @param {DOMElement} container
 */
function playAnimation(container = null) {
  if (typeof window === 'undefined' || !container) {
    return;
  }

  container.innerHtml = '';

  // Unhide first set of elements
  setTimeout(() => {
    ReactDOM.render(<HomePrimary />, container);
  }, delay.startup);

}

class Index extends Component {
  componentDidMount() {
    if (this.animateContainer) {
      playAnimation(this.animateContainer);
    }
  }

  componentDidUpdate() {
    if (this.animateContainer) {
      playAnimation(this.animateContainer);
    }
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
          ref={(el) => this.animateContainer = el}
        />
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
