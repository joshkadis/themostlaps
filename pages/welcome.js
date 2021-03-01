import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import Router from 'next/router';
import Layout from '../components/Layout';
import { LapPath } from '../components/lib/svg';
import { APIRequest } from '../utils';

/**
 * Temporarily added hard links due to old
 * Nextjs issue with CSS imports
 */

class Welcome extends Component {
  state = {
    status: 'ingesting',
    allTime: null,
  };

  // Only need this client-side
  componentDidMount() {
    // Set user value in local storage
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('TMLAthleteId', this.props.id);
    }

    this.fetchAthlete();
  }

  fetchAthlete = async () => {
    if (this.state.status !== 'ingesting') {
      return;
    }

    APIRequest(`/athletes/${this.props.id}`, {}, {})
      .then((apiResponse) => {
        if (!apiResponse.length || apiResponse[0].status === 'error') {
          this.setState({ status: 'error' });
          return;
        }

        if (apiResponse[0].status === 'ready') {
          window.location = `/rider/${this.props.id}`;
          return;
        }

        setTimeout(this.fetchAthlete, 1000);
      });
  };

  renderIngesting = (id) => (
    <div style={{ textAlign: 'center' }}>
      <h3>{"We're"} building your profile!</h3>
      <p>
        You&rsquo;ll be redirected to{' '}
        <a href={`/rider/${id}`}>your rider page</a>
        after {"we've"} downloaded your laps history from Strava.
      </p>
      <p>
        Or if you want to go ride some laps, you can come back later to <br />
        <a href={`/rider/${id}`}>https://themostlaps.com/rider/{id}</a>
      </p>
    </div>
  );

  renderError = (id) => (
    <div style={{ textAlign: 'center' }}>
      <h3>Something went wrong.</h3>
      <p>
        An error occurred while we were building{' '}
        <Link href={`/rider?athleteId=${id}`} as={`/rider/${id}`}>
          <a>your rider page</a>
        </Link>.
        </p>
      <p>
        We&rsquo;re looking into it;{' '}
          please email <a href="mailto:info@themostlaps.com">info@themostlaps.com</a>{' '}
          with any questions. Thanks!
        </p>
    </div>
  );

  renderReady = (id) => (
    <div style={{ textAlign: 'center' }}>
      <h3>Your profile is ready!</h3>
      <p>
        <Link href={`/rider?athleteId=${id}`} as={`/rider/${id}`}>
          <a>Click here</a>
        </Link>{' '}
        if you are not automatically redirected to view your laps.
      </p>
    </div>
  );

  render() {
    const renderContent = () => {
      switch (this.state.status) {
        case 'error':
          return this.renderError(this.props.id);

        case 'ready':
          return this.renderReady(this.props.id);

        case 'ingesting':
        default:
          return this.renderIngesting(this.props.id);
      }
    };

    return (<Layout
      pathname="/welcome"
      query={{}}
    >
      <h1>
        {this.state.status !== 'error'
          ? '🎉🚴 Welcome 🎉🚴'
          : '😞🚴 Welcome 🚴😞'
        }
      </h1>
      {renderContent()}
      <div
        style={{ textAlign: 'center' }}
        dangerouslySetInnerHTML={{ __html: LapPath('', 80) }}
      />
    </Layout>);
  }
}

Welcome.getInitialProps = ({ query }) => ({
  id: parseInt(query.id || 0, 10),
});

Welcome.propTypes = {
  id: PropTypes.number.isRequired,
};

export default Welcome;
