import React, { Component } from 'react';
import Modal from 'react-modal';
import Markdown from 'react-markdown';
import { CloseSvg } from './lib/svg';
import * as styles from './SignUpLink.css';
import modalMarkdown from 'raw-loader!../copy/modal.md';
import { stravaClientId } from '../config';
import { getEnvOrigin } from '../utils/envUtils';

function getSignupLinkUrl() {
  const params = [
    `client_id=${stravaClientId}`,
    'response_type=code',
    'scope=view_private',
    `redirect_uri=${encodeURIComponent(getEnvOrigin() + '/auth-callback')}`,
    'state=signup',
  ];

  return 'https://www.strava.com/oauth/authorize?' + params.join('&');
}

class SignUpLink extends Component {
  constructor(props) {
    super(props);
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.state = {
      modalIsOpen: false,
    };
  }

  handleOpenModal() {
    this.setState({ modalIsOpen: true });
  }

  handleCloseModal() {
    this.setState({ modalIsOpen: false });
  }

  // Only need this client-side
  componentDidMount() {
    Modal.setAppElement('#__next');
  }

  render() {
    return (
    <div style={{ display: 'inline' }}>
      <button
        className={this.props.className || ''}
        onClick={this.handleOpenModal}
      >
        {this.props.children || 'Sign Up'}
      </button>
      <Modal
        isOpen={this.state.modalIsOpen}
        onRequestClose={this.handleCloseModal}
        contentLabel="Sign Up"
        className={styles.modalContent}
        overlayClassName={styles.overlay}
      >
        <button
          aria-label="Close Modal"
          className={styles.closeModal}
          onClick={this.handleCloseModal}
        >
          <CloseSvg />
        </button>

        <Markdown
          className={styles.markdownContainer}
          source={modalMarkdown}
        />

        <div className={styles.connectButtonContainer}>
          <a href={getSignupLinkUrl()}>
            <img
              className={styles.connectButton}
              src="/static/btn_strava_connectwith_orange@2x.png"
              alt="Connect with Strava"
            />
          </a>
        </div>
      </Modal>
    </div>
    );
  }
}

export default SignUpLink;
