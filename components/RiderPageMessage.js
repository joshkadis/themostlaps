import React, { Component } from 'react';
import Button from './lib/Button';
import * as styles from './Layout.css';

class RiderPageMessage extends Component {
  state = {
    expanded: true,
  };

  onClickNoThanks = () => {
    this.setState({
      expanded: false,
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
          <p>
            Give us a minute to refresh your stats. If anything looks incorrect,
            {' '}please <a href="mailto:info@themostlaps.com">let us know</a>.
          </p>
        </>)
      : (<>
          <p>Thanks for updating your account info.</p>
          <p>Please give us a moment to refresh your stats.</p>
        </>);
  }

  render() {
    const doNotRender = !this.props.shouldShowUpdated
      && !this.props.isDuplicateSignup;

    if (!this.state.expanded || doNotRender) {
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
