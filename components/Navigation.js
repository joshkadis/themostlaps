import React, { Component } from 'react';
import Link from 'next/link';
import classNames from 'classnames';
import { lapSegmentId } from '../config';
import * as styles from './Navigation.css';
import { MenuSvg } from './lib/svg';

class Navigation extends Component {
  constructor(props) {
    super();
    this.toggleNavLinksContainer = this.toggleNavLinksContainer.bind(this);
  }

  toggleNavLinksContainer(evt) {
    if (!this.linksContainer) {
      return;
    }

    this.linksContainer.classList.toggle(styles.hidden);
  }

  render() {
    return (<div>
      <MenuSvg
        className={styles.menu}
        onClickHandler={this.toggleNavLinksContainer}
      />
      <nav
        className={classNames(styles.linksContainer, styles.hidden)}
        ref={(el) => { this.linksContainer = el; }}
        onClick={this.toggleNavLinksContainer}
      >
        <Link as="/prospectpark" href={`/park?segment=${lapSegmentId}`}>
          <a className={styles.link}>Prospect Park</a>
        </Link>
        <Link href="/about">
          <a className={styles.link}>About</a>
        </Link>
        <Link href="/help">
          <a className={styles.link}>Help</a>
        </Link>
        <span className={classNames(styles.link, styles.ctaLink)}>
          Post Your Laps
        </span>
      </nav>
    </div>);
  }
};

export default Navigation;
