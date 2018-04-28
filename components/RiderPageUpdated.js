import React, { Component } from 'react';
import Button from './lib/Button';
import * as styles from './Layout.css';

class RiderPageWelcome extends Component {
  state = {
    shouldDisplay: true,
  };

  onClickNoThanks = () => {
    this.setState({
      shouldDisplay: false,
    });
  };

  render() {
    if (!this.state.shouldDisplay) {
      return null;
    }

    return (
      <div className={styles.riderPageWelcome__container}>
        <p>
          Thanks for updating your account info.
          Please give us a moment while we refresh your stats. Thanks!
        </p>
        <div className={styles.riderPageWelcome__shareLinks}>
          <Button
            onClick={this.onClickNoThanks}
            className={styles.riderPageWelcome__noThanks}
          >
            Got it
          </Button>
        </div>
      </div>
    );
  }
}

export default RiderPageWelcome;
