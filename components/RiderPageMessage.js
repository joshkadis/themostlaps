import React, { Component } from 'react';
import Button from './lib/Button';
import * as styles from './Layout.css';

class RiderPageMessage extends Component {
  state = {
    wasClosed: false,
  };

  onClickNoThanks = () => {
    this.setState({
      wasClosed: true,
    });
  };

  showMessage() {
    const {
      shouldShowUpdated,
      isDuplicateSignup,
    } = this.props;

    if (!shouldShowUpdated && !isDuplicateSignup) {
      return null;
    }

    // Duplicate signup takes precedence.
    return isDuplicateSignup
      ? (<>
          <p>Looks like you{"'"}re already signed up!</p>
          {/* eslint-disable-next-line */}
          <p>If something about your profile or stats looks incorrect, email us.</p>
        </>)
      : (<>
          <p>Thanks for updating your account info.</p>
          <p>Please give us a moment to refresh your stats.</p>
        </>);
  }

  render() {
    const {
      shouldShowUpdated,
      isDuplicateSignup,
    } = this.props;

    if (
      this.state.wasClosed
      || (!shouldShowUpdated && !isDuplicateSignup)
    ) {
      return null;
    }

    return (
      <div className={styles.riderPageWelcome__container}>
        {this.showMessage()}
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

export default RiderPageMessage;
