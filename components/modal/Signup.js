import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Markdown from 'react-markdown';
import * as styles from './Signup.css';
import ConnectWithStravaButton from '../ConnectWithStravaButton';
import pageContent from 'raw-loader!../../copy/signupModal.md';
import convertMarkdownLink from '../lib/convertMarkdownLink';

class Signup extends Component {
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
      <div>
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
        <Markdown
          source={pageContent}
          escapeHtml={false}
          renderers={{ link: convertMarkdownLink }}
        />
      </div>
    );
  }
}

Signup.propTypes = {
  pathname: PropTypes.string.isRequired,
}

export default Signup;
