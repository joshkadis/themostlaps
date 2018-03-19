import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import classNames from 'classnames';
import Button from './lib/Button';
import { lapSegmentId, breakpointPx } from '../config';
import * as styles from './Navigation.css';
import { MenuSvg, InstagramSvg, TwitterSvg } from './lib/svg';
import SocialLink from './lib/SocialLink';
import { modalControlsShape } from '../utils/propTypes';
import { trackModalOpen, setDimensions } from '../utils/analytics';
import SearchUsers from './lib/SearchUsers';

class Navigation extends Component {
  constructor(props) {
    super(props);
    this.mobileToggleNav = this.mobileToggleNav.bind(this);
    this.onClickButton = this.onClickButton.bind(this);
    this.onClickRidersButton = this.onClickRidersButton.bind(this);

    this.state = {
      shouldShowMobileNav: false,
      shouldShowSearchUsers: false,
    };
  }

  onClickButton() {
    this.setState({ shouldShowMobileNav: false });
    this.props.modalControls.open();
    setDimensions({ 'Signup Starting Point': 'nav' });
    trackModalOpen();
  }

  mobileToggleNav() {
    this.setState({
      shouldShowMobileNav: !this.state.shouldShowMobileNav,
    });
  }

  navigateToRiderPage(selection) {
    console.log(selection);
  }

  onClickRidersButton() {
    this.setState({
      shouldShowSearchUsers: !this.state.shouldShowSearchUsers,
    });
  }

  render() {
    return (<div style={{ position: 'relative' }}>
      <MenuSvg
        className={styles.menu}
        onClickHandler={this.mobileToggleNav}
      />
      {!this.state.shouldShowSearchUsers && (
        <nav
          className={classNames(
            styles.linksContainer,
            { [styles.hideMobile]: !this.state.shouldShowMobileNav },
            { [styles.showingSearchUsers]: this.state.shouldShowSearchUsers }
          )}
          ref={(el) => { this.linksContainer = el; }}
        >
          <Link href="/ranking">
            <a className={styles.link}>Rankings</a>
          </Link>

          <Link href="/page?pageName=about" as="/about">
            <a className={styles.link}>About</a>
          </Link>

          <button
            className={classNames(styles.link, styles.textButton)}
            onClick={this.onClickRidersButton}
          >
            Riders
            <span style={{ fontSize: '.75em' }}>
              {this.state.shouldShowSearchUsers ? ' ▲' : ' ▼'}
            </span>
          </button>

          <SocialLink network="twitter">
            <TwitterSvg />
          </SocialLink>

          <SocialLink network="instagram">
            <InstagramSvg />
          </SocialLink>

          <Button
            onClick={this.onClickButton}
          >
            Sign Up
          </Button>
        </nav>
      )}
      {this.state.shouldShowSearchUsers && (
        <div className={styles.searchUsersContainer}>
          <SearchUsers
            autoFocus
            onChange={this.navigateToRiderPage}
            onBlur={() => this.setState({ shouldShowSearchUsers: false })}
          />
        </div>
      )}
    </div>);
  }
};

Navigation.propTypes = {
  modalControls: PropTypes.shape(modalControlsShape).isRequired,
  modalIsOpen: PropTypes.bool.isRequired,
};

export default Navigation;
