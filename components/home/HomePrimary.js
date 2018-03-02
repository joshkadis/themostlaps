import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as styles from '../Layout.css';

class HomePrimary extends Component {
  componentDidMount() {
    if ('undefined' !== typeof document && this.container) {
      setTimeout(() => {
        this.container
          .querySelectorAll(`.${styles.home__transparent}`)
          .forEach((el) => el.classList.remove(styles.home__transparent));
        }, this.props.delays.initTransition);
    }
  }

  render() {
    const { one, two, three } = this.props.delays;
    return (
      <div
        className={styles.home__inner}
        id="home-primary"
        ref={(el) => this.container = el}
      >
        <p>
          <span
            data-step="one"
            style={{ transitionDelay: `${one}ms` }}
            className={classNames(
              styles.home__block,
              styles.home__big,
              styles.home__transparent,
            )}
          >
            Who has the KOM
          </span>
          <span
            className={classNames(
              styles.home__big,
              styles.home__mobilespacer,
              styles.home__transparent,
            )}
          ></span>
          <span
            data-step="two"
            style={{ transitionDelay: `${two}ms` }}
            className={classNames(
              styles.home__block,
              styles.home__big,
              styles.home__transparent,
            )}
            >
            for Prospect Park?
          </span>
        </p>
        <p
          data-step="three"
          style={{ transitionDelay: `${three}ms` }}
          className={classNames(
            'bigger',
            styles.home__block,
            styles.home__transparent,
          )}
        >
          Who cares.
        </p>
      </div>
    );
  }
}

HomePrimary.propTypes = {
  delays: PropTypes.object.isRequired,
};

export default HomePrimary;