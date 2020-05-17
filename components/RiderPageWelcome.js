import PropTypes from 'prop-types';
import React, { Component } from 'react';
import TweetButton from './lib/TweetButton';
import FBShareButton from './lib/FBShareButton';
import Button from './lib/Button';
import * as styles from './Layout.css';

class RiderPageWelcome extends Component {
  state = {
    shouldDisplay: true,
    shouldShowNoThanks: false,
  };

  onClickNoThanks = () => {
    this.setState({
      shouldDisplay: false,
    });
  };

  componentDidMount() {
    // Hacky way to delay showing No Thanks button
    // ~until Tweet and FB Share have loaded
    setTimeout(() => {
      this.setState({ shouldShowNoThanks: true });
    }, 1500);
  }

  render() {
    if (!this.state.shouldDisplay) {
      return null;
    }

    const { allTime, firstname } = this.props;
    return (
      <div className={styles.riderPageWelcome__container}>
        <p>
          Hey {firstname}! Want to tell your friends about The Most Laps?
        </p>
        <div className={styles.riderPageWelcome__shareLinks}>
          <TweetButton laps={allTime} />
          <FBShareButton />
          {this.state.shouldShowNoThanks && <Button
            onClick={this.onClickNoThanks}
            className={styles.riderPageWelcome__noThanks}
          >
            No thanks
          </Button>}
        </div>
      </div>
    );
  }
}

RiderPageWelcome.propTypes = {
  allTime: PropTypes.number,
  firstname: PropTypes.string,
};

export default RiderPageWelcome;
