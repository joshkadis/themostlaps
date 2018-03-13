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

class Navigation extends Component {
  constructor(props) {
    super(props);
    this.mobileToggleNav = this.mobileToggleNav.bind(this);
    this.onClickButton = this.onClickButton.bind(this);
    this.state = {
      shouldShowMobileNav: false,
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

  render() {
    return (<div>
      <MenuSvg
        className={styles.menu}
        onClickHandler={this.mobileToggleNav}
      />
      <nav
        className={classNames(
          styles.linksContainer,
          { [styles.hideMobile]: !this.state.shouldShowMobileNav }
        )}
        ref={(el) => { this.linksContainer = el; }}
      >
        <Link href="/ranking">
          <a className={styles.link}>Rankings</a>
        </Link>

        <Link href="/page?pageName=about" as="/about">
          <a className={styles.link}>About</a>
        </Link>

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
    </div>);
  }
};

Navigation.propTypes = {
  modalControls: PropTypes.shape(modalControlsShape).isRequired,
  modalIsOpen: PropTypes.bool.isRequired,
};

export default Navigation;
