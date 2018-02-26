import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import classNames from 'classnames';
import Button from './lib/Button';
import { lapSegmentId, breakpointPx } from '../config';
import * as styles from './Navigation.css';
import { MenuSvg } from './lib/svg';
import { modalControlsShape } from '../utils/propTypes';

/**
 * Determine if nav should be shown, isomorphically
 */
function shouldShowNav() {
  // Show by default from server
  if ('undefined' === typeof window || !window.innerWidth) {
    return true;
  }

  // Hide for small viewport
  return window.innerWidth >= breakpointPx;
}

class Navigation extends Component {
  constructor(props) {
    super(props);
    this.toggleNavLinksContainer = this.toggleNavLinksContainer.bind(this);
  }

  toggleNavLinksContainer(evt) {
    if (!this.linksContainer || shouldShowNav()) {
      return;
    }

    this.linksContainer.classList.toggle(styles.hidden);
  }

  componentDidMount() {
    if (shouldShowNav()) {
      this.linksContainer.classList.remove(styles.hidden);
    } else {
      this.linksContainer.classList.add(styles.hidden);
    }
  }

  render() {
    return (<div>
      <MenuSvg
        className={styles.menu}
        onClickHandler={this.toggleNavLinksContainer}
      />
      <nav
        className={classNames(styles.linksContainer, { [styles.hidden]: shouldShowNav() })}
        ref={(el) => { this.linksContainer = el; }}
        onClick={this.toggleNavLinksContainer}
      >
        <Link href="/ranking">
          <a className={styles.link}>Rankings</a>
        </Link>
        <Link href="/about">
          <a className={styles.link}>About</a>
        </Link>
        <Link href="/help">
          <a className={styles.link}>Help</a>
        </Link>
        <Button
          onClick={this.props.modalControls.open}
        >
          Sign Up
        </Button>
      </nav>
    </div>);
  }
};

Navigation.propTypes = {
  modalControls: PropTypes.shape(modalControlsShape).isRequired,
}

export default Navigation;
