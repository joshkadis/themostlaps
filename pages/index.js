import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Layout from '../components/Layout';
import Button from '../components/lib/Button';
import { getPathnameFromContext, APIRequest } from '../utils';
import { triggerModalOpen } from '../utils/modal';
import * as styles from '../components/Layout.css';

const delay = {
  startup: 500,
  transition: 1000,
  one: 0,
  two: 1000,
  three: 3500,
  interstitial: 3000,
};

function unhideChildElements(id) {
  if (typeof document === 'undefined') {
    return;
  }
  document
    .querySelectorAll(`#${id} .home__hide`)
    .forEach((el) => el.classList.remove('home__hide'));
}

function playAnimation() {
  if (typeof document === 'undefined') {
    return;
  }

  // Unhide first set of elements
  setTimeout(() => {
    unhideChildElements('home-primary');
  }, delay.startup);

  // Unhide second set of elements
  const secondaryDelay = delay.startup + delay.three + delay.transition + delay.interstitial;
  setTimeout(() => {
    document.getElementById('home-primary')
      .classList.add('home__display-none');

    document.getElementById('home-secondary')
      .classList.remove('home__display-none');

    setTimeout(() => unhideChildElements('home-secondary'), 0);
  }, secondaryDelay)

}

class Index extends Component {
  componentDidMount() {
    console.log('MOUNTED');
    playAnimation();
  }

  componentDidUpdate() {
    console.log('UPDATED');
    playAnimation();
  }
  render() {
    const { pathname, query, siteTotals } = this.props;
    return (
      <Layout
        pathname={pathname}
        query={query}
        style={{ textAlign: 'center' }}
      >
        <div id="home-primary">
          <span className={classNames(
            'home__hide',
            styles['home__block--big'],
            styles.home__one
          )}>
            Who has the KOM
          </span>
          <span className={classNames(
            'home__hide',
            styles['home__block--big'],
            styles.home__two
          )}>
            for Prospect Park?
          </span>
          <span className={classNames(
            'home__hide',
            'bigger',
            styles.home__block,
            styles.home__three
          )}>
            Who cares.
          </span>
        </div>

        <div
          id="home-secondary"
          className="home__display-none"
        >
          <span className={classNames(
            'home__hide',
            styles['home__block--big'],
            styles.home__one
          )}>
            How many laps
          </span>
          <span className={classNames(
            'home__hide',
            styles['home__block--big'],
            styles.home__two
          )}>
            have you ridden?
          </span>
          <span
            className={classNames(
              'home__hide',
              styles.home__block,
              styles.home__three
            )}
          >
            <Button
              onClick={triggerModalOpen}
              style={{
                fontSize: '2rem',
                padding: '1.4rem',
                letterSpacing: '1px',
              }}
            >
              Find Out Now
            </Button>
          </span>
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
