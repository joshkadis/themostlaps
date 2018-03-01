import React, { Component } from 'react';
import classNames from 'classnames';
import { triggerModalOpen } from '../../utils/modal';
import * as styles from '../Layout.css';
import Button from '../lib/Button';

class HomeSecondary extends Component {

  render() {
    return (
      <div id="home-secondary">
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
    );
  }
}

export default HomeSecondary;
