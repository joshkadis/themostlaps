import React, { Component } from 'react';
import Modal from 'react-modal';

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
      >
        <h2>hello moto</h2>
        <button onClick={this.handleCloseModal}>Close Modal</button>
      </Modal>
    </div>
    );
  }
}

export default SignUpLink;
