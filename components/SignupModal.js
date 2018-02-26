import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Markdown from 'react-markdown';
import * as styles from './SignupModal.css';
import ConnectWithStravaButton from './ConnectWithStravaButton';
import pageContent from 'raw-loader!../copy/signupModal.md';

class SignupModal extends Component {
  constructor(props) {
    super(props);
    this.onChangeSubscribe = this.onChangeSubscribe.bind(this);
    this.state = {
      subscribeChecked: true,
    };
  }

  onChangeSubscribe({ target }) {
    this.setState({ subscribeChecked: target.checked });
  }

  render() {
    return (
      <div className={styles.container}>
        <div className={styles.main}>
          <h2>🚴 Let's get started ! 🚴</h2>
          <ConnectWithStravaButton
            pathname={this.props.pathname}
            shouldSubscribe={this.state.subscribeChecked}
          />
          <p className={styles.subscribeContainer}>
            <input
              id="subscribe"
              name="subscribe"
              type="checkbox"
              checked={this.state.subscribeChecked}
              onChange={this.onChangeSubscribe}
            />
            <label htmlFor="subscribe">Send me occasional laps-related emails.</label>
          </p>
        </div>
        <Markdown source={pageContent} />
      </div>
    );
  }
}

SignupModal.propTypes = {
  pathname: PropTypes.string.isRequired,
}

export default SignupModal;
