import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import { withRouter } from 'next/router';
import classNames from 'classnames';
import Button from './lib/Button';
import * as styles from './Navigation.css';
import * as layoutStyles from './Layout.css';
import { MenuSvg, InstagramSvg } from './lib/svg';
import SocialLink from './lib/SocialLink';
import { modalControlsShape } from '../utils/propTypes';
import { trackModalOpen, setDimensions } from '../utils/analytics';
import SearchUsers from './lib/SearchUsers';
import { isSmallViewport } from '../utils/window';
import { defaultLocation } from '../config';

class Navigation extends Component {
  constructor(props) {
    super(props);
    this.mobileToggleNav = this.mobileToggleNav.bind(this);
    this.onClickButton = this.onClickButton.bind(this);
    this.onClickRidersButton = this.onClickRidersButton.bind(this);
    /* eslint-disable-next-line max-len */
    this.renderSearchUsersContainer = this.renderSearchUsersContainer.bind(this);
    this.navigateToRiderPage = this.navigateToRiderPage.bind(this);

    this.defaultState = {
      shouldShowMobileNav: false,
      shouldShowSearchUsers: false,
    };

    this.state = this.defaultState;
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
    if (selection && selection.value) {
      this.setState(this.defaultState);
      this.props.router.push(
        `/rider?athleteId=${selection.value}`,
        `/rider/${selection.value}`,
      );
    }
  }

  onClickRidersButton() {
    this.setState({
      shouldShowSearchUsers: !this.state.shouldShowSearchUsers,
    });
  }

  /**
   * Render SearchUsers container when it's supposed to be rendered, depending on viewport
   *
   * @param {Bool} shouldShowForSmallViewport
   * @return {JSX}
   */
  renderSearchUsersContainer(shouldShowForSmallViewport = true) {
    if (!this.state.shouldShowSearchUsers
      || isSmallViewport() !== shouldShowForSmallViewport
    ) {
      return null;
    }

    return (
      <div className={styles.searchUsersContainer}>
        <div className={styles.searchUsersField}>
          <SearchUsers
            autoFocus
            onChange={this.navigateToRiderPage}
            onBlur={() => this.setState({ shouldShowSearchUsers: false })}
          />
        </div>

        <Button
          onClick={() => this.setState({ shouldShowSearchUsers: false })}
          className={layoutStyles.compare_closeSearchUsersButton}
        >
          Clear
        </Button>
      </div>
    );
  }

  render() {
    return (<div>
      <MenuSvg
        className={styles.menu}
        onClickHandler={this.mobileToggleNav}
      />
      {(!this.state.shouldShowSearchUsers || isSmallViewport()) && (
        <nav
          className={classNames(
            styles.linksContainer,
            { [styles.hideMobile]: !this.state.shouldShowMobileNav },
          )}
          ref={(el) => { this.linksContainer = el; }}
        >
          <Link
            href={`/ranking?location=${defaultLocation}`}
            as={`/ranking/${defaultLocation}`}
          >
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
          </button>

          {this.renderSearchUsersContainer()}

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
      {this.renderSearchUsersContainer(false)}
    </div>);
  }
}

Navigation.propTypes = {
  modalControls: PropTypes.shape(modalControlsShape).isRequired,
  modalIsOpen: PropTypes.bool.isRequired,
  router: PropTypes.object.isRequired,
};

export default withRouter(Navigation);
