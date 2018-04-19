import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Layout from '../components/Layout';
import { welcomeContent } from '../config/content';
import { LapPath } from '../components/lib/svg';

class Welcome extends Component {
  constructor(props) {
    super(props);

    this.state = {
      status: 'ingesting',
      allTime: null,
    };
  }

  // Only need this client-side
  componentDidMount() {
    // Set user value in local storage
    if ('undefined' !== typeof window && window.localStorage) {
      localStorage.setItem('TMLAthleteId', this.props.id)
    }
  }

  render() {
    return (<Layout
      pathname="/welcome"
      query={{}}
    >
      <h1>🎉🚴 Welcome {this.props.firstname} 🎉🚴</h1>
      {this.state.status === 'ingesting' && (
        <div style={{ textAlign: 'center' }}>
          <h3>This will take a moment...</h3>
          <div
            dangerouslySetInnerHTML={{ __html: LapPath('', 80) }}
          />
          <p>{welcomeContent.ingesting}</p>
        </div>
      )}
    </Layout>);
  }
}

Welcome.getInitialProps = ({ query }) => ({
  firstname: query.firstname || 'rider',
  id: parseInt(query.id || 0, 10),
});

Welcome.propTypes = {
  id: PropTypes.number.isRequired,
  firstname: PropTypes.string.isRequired,
};

export default Welcome;
