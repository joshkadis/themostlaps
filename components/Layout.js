import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';
import * as styles from './Layout.css';
import Modal from 'react-modal';
import { CloseSvg } from './lib/svg';
import numberOrNullProp from '../utils/numberOrNullProp';
import AuthError from './AuthError';
import AuthSuccess from './AuthSuccess';

/**
 * Page layout
 */
class Layout extends Component {
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

  queryHasAuthError(query = {}) {
    return query.autherror && !isNaN(query.autherror);
  }

  componentWillMount() {
    if (this.queryHasAuthError(this.props.query) || this.props.query.authsuccess) {
      this.setState({ modalIsOpen: true });
    }
  }

  // Only need this client-side
  componentDidMount() {
    Modal.setAppElement('#__next');
  }

  render() {
    const authCode = this.queryHasAuthError(this.props.query) ?
      parseInt(this.props.query.autherror, 10) :
      null;

    return (
      <div>
        <Head>
          <meta charset="utf-8" />
          <meta http-equiv="x-ua-compatible" content="ie=edge" />
          <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no, maximum-scale=1" />
          <link rel="stylesheet" href="/_next/static/style.css" />
        </Head>
        <Header pathname={this.props.pathname} />
        <div className={styles.main}>
          {this.props.children}
        </div>
        <Footer />
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
          <div>
            {authCode ?
              <AuthError code={authCode} /> :
              <AuthSuccess
                id={parseInt(this.props.query.id, 10)}
                firstname={this.props.query.firstname}
                email={this.props.query.email}
                allTime={parseInt(this.props.query.allTime, 10)}
              />
            }
          </div>
        </Modal>
      </div>
    );
  }
}

Layout.propTypes = {
  query: PropTypes.object.isRequired,
  pathname: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default Layout;
