import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Layout from '../components/Layout';
import Button from '../components/lib/Button';
import { LapPath } from '../components/lib/svg';
import { getPathnameFromContext, APIRequest } from '../utils';
import { triggerModalOpen } from '../utils/modal';
import * as styles from '../components/Layout.css';

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
    document.getElementById('home-primary').style.display = 'none';
    unhideChildElements('home-secondary');
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
        <div className={styles['home__background']}>
          <LapPath className={styles['home__background--svg']} />
        </div>

        <div style={{display:'none'}} id="home-primary">
          <p
            data-animated="one"
            className={classNames(
              styles['home__block--big'],
              styles['home__block--one'],
            )}
          >
            Who has the KOM
          </p>
          <p
            data-animated="two"
            className={classNames(
              styles['home__block--big'],
              styles['home__block--two'],
            )}
            >
            for Prospect Park?
          </p>
          <p
            data-animated="three"
            className={classNames(
              'bigger',
              styles.home__block,
            )}
          >
            Who cares.
          </p>
        </div>
        <div style={{display:'none'}} id="home-secondary">
          <p
            data-animated="one"
            className={classNames(
              styles['home__block--big'],
            )}
          >
            How many laps
          </p>
          <p
            data-animated="two"
            className={classNames(
              styles['home__block--big'],
            )}
            >
            have you ridden?
          </p>
          <p
            data-animated="three"
            className={classNames(
              'bigger',
              styles.home__block,
            )}
          >
            Good question.
          </p>
          <p
            data-animated="four"
            className={classNames(
              styles.home__block,
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
          </p>
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
