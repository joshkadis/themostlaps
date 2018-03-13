import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import Router from 'next/router';
import { stringify } from 'query-string';
import Header from './Header';
import Footer from './Footer';
import * as styles from './Layout.css';
import Modal from 'react-modal';
import { CloseSvg } from './lib/svg';
import { getPathWithQueryString } from '../utils';
import numberOrNullProp from '../utils/numberOrNullProp';
import ModalContents from './ModalContents';
import Signup from './modal/Signup';
import AuthSuccess from './modal/AuthSuccess';
import AuthError from './modal/AuthError';
import { modalTitles, locale } from '../config';
import { getDocumentTitle, getOgData } from '../utils/metaTags';
import { trackPageview, trackAuthResult } from '../utils/analytics';

Router.onRouteChangeComplete = (pathname) => {
  trackPageview(pathname);
};

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

  componentWillMount() {
    const modalState = this.getModalStateFromProps(this.props);
    // Automatically open modal on render
    // if authsuccess or autherror query params are found
    this.setState({
      modalIsOpen: (modalState !== 'signup'),
      modalState,
    });
  }

  componentWillReceiveProps(nextProps) {
    // Open modal on update if authsuccess or autherror
    // query params are found OR if it is already open
    const modalState = this.getModalStateFromProps(nextProps);
    this.setState({
      modalIsOpen: (this.state.modalIsOpen || modalState !== 'signup'),
      modalState,
    });
  }

  // Only need this client-side
  componentDidMount() {
    Modal.setAppElement('#__next');

    if ('#signup' === window.location.hash) {
      this.handleOpenModal();
    }

    window.addEventListener('hashchange', () => {
      if ('#signup' === window.location.hash) {
        this.handleOpenModal();
      }
    });

    if (this.state.modalIsOpen && this.state.modalState !== 'signup') {
      trackAuthResult(
        this.state.modalState === 'success',
        this.props.query.autherror || null,
      );
    }
  }

  handleOpenModal() {
    if ('#signup' !== window.location.hash) {
      window.location.hash = '#signup';
    }

    this.setState({ modalIsOpen: true });
  }

  handleCloseModal() {
    window.location.hash = '';
    this.setState({
      modalIsOpen: false,
      modalState: 'signup',
    });

    // Remove modal-related query string params from current URL
    Router.replace(
      getPathWithQueryString(Router.router),
      window.location.pathname
    );
  }

  getModalStateFromProps({ query }) {
    if (query.autherror && !isNaN(query.autherror)) {
      return 'error';
    } else if (query.authsuccess) {
      return 'success';
    }
    return 'signup';
  }

  getModalTitle(props) {
    const allTime = props.query && props.query.allTime && !isNaN(props.query.allTime) ?
      parseInt(props.query.allTime, 10).toLocaleString(locale) :
      null;

    switch(this.getModalStateFromProps(props)) {
      case 'error':
        return modalTitles.error;

      case 'success':
        return allTime ?
          modalTitles.successWithLaps.replace('${allTime}', allTime) :
          modalTitles.success;

      case 'signup':
      default:
        return modalTitles.signup;
    }
  }

  getModalContents(props) {
    const { query, pathname } = props;
    switch(this.getModalStateFromProps(props)) {
      case 'error':
        return <AuthError code={parseInt(query.autherror, 10)} />

      case 'success':
        return <AuthSuccess
          firstname={props.query.firstname}
          allTime={parseInt(props.query.allTime, 10)}
        />

      case 'signup':
      default:
        return <Signup pathname={pathname} />;
    }
  }

  render() {
    // Use aria-hidden for main content area if server is rendering with modal open
    // In client, we rely on Modal.setAppElement()
    const shouldHideDuringRender = 'undefined' === typeof document &&
      this.state.modalIsOpen;

    return (
      <div
        style={this.props.style}
        aria-hidden={shouldHideDuringRender ? 'true' : null}
      >
        <Head>
          <meta charset="utf-8" />
          <meta http-equiv="x-ua-compatible" content="ie=edge" />
          <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no, maximum-scale=1" />
          <title>{getDocumentTitle(this.props.pathname)}</title>
          {getOgData().map((tag) =>
            <meta
              key={tag[0]}
              property={`og:${tag[0]}`}
              content={tag[1]}
            />
          )}
          <link rel="shortcut icon" type="image/x-icon" href="/static/img/themostlaps.ico" />
          <link href="https://fonts.googleapis.com/css?family=Arvo:400,700" rel="stylesheet" />
          <link rel="stylesheet" href="/static/css/react-select.css" />
          <link rel="stylesheet" href="/_next/static/style.css" />
        </Head>
        <Header
          modalControls={{
            open: this.handleOpenModal,
            close: this.handleCloseModal,
          }}
          modalIsOpen={this.state.modalIsOpen}
        />
        <div className={styles.main}>
          <div className={ '/' !== this.props.pathname ? styles.mainContainer : null}>
            {this.props.children}
          </div>
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
          <ModalContents title={this.getModalTitle(this.props)}>
            {this.getModalContents(this.props)}
          </ModalContents>
        </Modal>
      </div>
    );
  }
}

Layout.defaultProps = {
  query: {},
  pathname: '/',
  style: {},
}

Layout.propTypes = {
  query: PropTypes.object,
  pathname: PropTypes.string,
  children: PropTypes.node.isRequired,
  style: PropTypes.object,
};

export default Layout;
