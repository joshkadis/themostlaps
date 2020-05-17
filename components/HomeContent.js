/* eslint-disable no-return-assign */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as styles from './Layout.css';
import { homeContent } from '../config/content';
import { triggerModalOpen } from '../utils/modal';
import { trackModalOpen, setDimensions } from '../utils/analytics';
import Button from './lib/Button';

class HomePrimary extends Component {
  constructor(props) {
    super(props);
    this.fade = this.fade.bind(this);
  }

  componentDidMount() {
    this.fade();
  }

  componentDidUpdate() {
    this.fade();
  }

  triggerModalOpen = () => {
    triggerModalOpen();
    setDimensions({ 'Signup Starting Point': 'homepage' });
    trackModalOpen();
  };

  fade() {
    if (typeof document !== 'undefined' && this.container) {
      setTimeout(() => {
        if (!this.container) {
          return;
        }

        this.container
          .querySelectorAll('[data-toggleopacity]')
          .forEach((el) => {
            if (this.props.isVisible) {
              el.classList.remove(styles.home__transparent);
            } else {
              el.classList.add(styles.home__transparent);
            }
          });
      }, this.props.delays.initTransition);
    }
  }

  render() {
    const {
      one, two, three, four,
    } = this.props.delays;
    return (
      <div
        className={styles.home__inner}
        id="home-primary"
        ref={(el) => this.container = el}
      >
        <p>
          <span
            data-toggleopacity
            style={this.props.isVisible ? { transitionDelay: `${one}ms` } : null}
            className={classNames(
              styles.home__block,
              styles.home__big,
              styles.home__transparent,
            )}
          >
            {homeContent[this.props.contentMode].one}
          </span>
          <span
            className={classNames(
              styles.home__big,
              styles.home__mobilespacer,
              styles.home__transparent,
            )}
          ></span>
          <span
            data-toggleopacity
            style={this.props.isVisible ? { transitionDelay: `${two}ms` } : null}
            className={classNames(
              styles.home__block,
              styles.home__big,
              styles.home__transparent,
            )}
          >
            {homeContent[this.props.contentMode].two}
          </span>
        </p>
        <p
          data-toggleopacity
          style={this.props.isVisible ? { transitionDelay: `${three}ms` } : null}
          className={classNames(
            'bigger',
            styles.home__block,
            styles.home__transparent,
          )}
        >
          {homeContent[this.props.contentMode].three}
        </p>
        {this.props.contentMode === 'secondary'
          && <div
            data-toggleopacity
            style={this.props.isVisible ? { transitionDelay: `${four}ms` } : null}
            className={classNames(
              styles.home__block,
              styles.home__transparent,
            )}
          >
            <Button
              className={styles.home__button}
              onClick={this.triggerModalOpen}
            >
              Get Your Stats
            </Button>
          </div>
        }
      </div>
    );
  }
}

HomePrimary.propTypes = {
  delays: PropTypes.object.isRequired,
  contentMode: PropTypes.string.isRequired,
  isVisible: PropTypes.bool.isRequired,
};

export default HomePrimary;
