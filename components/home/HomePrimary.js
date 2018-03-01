import React, { Component } from 'react';
import classNames from 'classnames';
import * as styles from '../Layout.css';

class HomePrimary extends Component {
  componentDidMount() {
    if ('undefined' !== typeof document && this.container) {
      setTimeout(() => {
        this.container
          .querySelectorAll(`.${styles.home__transparent}`)
          .forEach((el) => el.classList.remove(styles.home__transparent));
        }, 100);
    }
  }

  render() {
    return (
      <div
        id="home-primary"
        ref={(el) => this.container = el}
      >
        <p>
          <span
            data-step="one"
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
          >&nbsp;</span>
          <span
            data-step="two"
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
          style={{ transitionDelay: '2s' }} /* @todo Use delay from config here */
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

export default HomePrimary;