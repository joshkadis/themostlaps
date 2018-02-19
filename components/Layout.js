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
import ConnectWithStravaButton from './ConnectWithStravaButton';
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
      modalState: 'signup',
    };
  }

  handleOpenModal() {
    this.setState({ modalIsOpen: true });
  }

  handleCloseModal() {
    this.setState({
      modalIsOpen: false,
      modalState: 'signup',
    });
  }

  queryHasAuthError(query = {}) {
    return query.autherror && !isNaN(query.autherror);
  }

  getModalStateFromProps(props) {
    if (this.queryHasAuthError(props.query)) {
      return 'error';
    } else if (props.query && props.query.authsuccess) {
      return 'success';
    }
    return 'signup';
  }

  componentWillMount() {
    const modalState = this.getModalStateFromProps(this.props);
    this.setState({
      modalIsOpen: (modalState !== 'signup'),
      modalState,
    });
  }

  componentWillReceiveProps(nextProps) {
    // @todo Refactor above into single method
    const modalState = this.getModalStateFromProps(nextProps);
    this.setState({
      modalIsOpen: (modalState !== 'signup'),
      modalState,
    });
  }

  // Only need this client-side
  componentDidMount() {
    Modal.setAppElement('#__next');
  }

  render() {
    const authErrorCode = this.queryHasAuthError(this.props.query) ?
      parseInt(this.props.query.autherror, 10) :
      null;

    return (
      <div>
        <Head>
          <meta charset="utf-8" />
          <meta http-equiv="x-ua-compatible" content="ie=edge" />
          <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no, maximum-scale=1" />
          <link href="https://fonts.googleapis.com/css?family=Arvo:400,700" rel="stylesheet" />          <link rel="stylesheet" href="/_next/static/style.css" />
        </Head>
        <Header
          modalControls={{
            open: this.handleOpenModal,
            close: this.handleCloseModal,
          }}
        />
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
            {!!authErrorCode &&
              <AuthError code={authErrorCode} />}

            {!!this.props.query.authsuccess &&
              <AuthSuccess
                id={parseInt(this.props.query.id, 10)}
                firstname={this.props.query.firstname}
                email={this.props.query.email}
                allTime={parseInt(this.props.query.allTime, 10)}
              />}

            {(!authErrorCode && !this.props.query.authsuccess) &&
              <ConnectWithStravaButton pathname={this.props.pathname} />}
          </div>
        </Modal>
      </div>
    );
  }
}

Layout.defaultProps = {
  query: {},
  pathname: '/',
}

Layout.propTypes = {
  query: PropTypes.object,
  pathname: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default Layout;
