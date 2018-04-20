import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
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
      <h1>🎉🚴 Welcome 🎉🚴</h1>
      {this.state.status === 'ingesting' && (
        <div style={{ textAlign: 'center' }}>
          <h3>We're building your profile!</h3>
          <div
            dangerouslySetInnerHTML={{ __html: LapPath('', 80) }}
          />
          <p>
            You can check out{' '}
            <Link href={`/rider?athleteId=${this.props.id}`} as={`/rider/${this.props.id}`}>
              <a>your rider page</a>
            </Link>
            {' '}after we've downloaded all your past laps from Strava.
            Feel free to wait here or go for a ride. We'll email you when your
            profile is ready.
          </p>
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
