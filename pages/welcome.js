import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import Router from 'next/router';
import Layout from '../components/Layout';
import { welcomeContent } from '../config/content';
import { LapPath } from '../components/lib/svg';
import { APIRequest } from '../utils';

class Welcome extends Component {

  state = {
    status: 'ingesting',
    allTime: null,
  }

  // Only need this client-side
  componentDidMount() {
    // Set user value in local storage
    if ('undefined' !== typeof window && window.localStorage) {
      localStorage.setItem('TMLAthleteId', this.props.id)
    }

    this.fetchAthlete();
  }

  fetchAthlete = async () => {
    if ('ingesting' !== this.state.status) {
      return;
    }

    APIRequest(`/athletes/${this.props.id}`, {}, {})
      .then((apiResponse) => {
        if (!apiResponse.length || 'error' === apiResponse[0].status) {
          this.setState({ status: 'error' });
          return;
        }

        if ('ready' === apiResponse[0].status) {
          Router.push(
            `/rider?athleteId=${this.props.id}`,
            `/rider/${this.props.id}`,
          );
          return;
        }

        setTimeout(this.fetchAthlete, 1000);
      });
  }

  renderIngesting(id) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h3>We're building your profile!</h3>
        <p>
          You'll be redirected to{' '}
          <Link href={`/rider?athleteId=${id}`} as={`/rider/${id}`}>
            <a>your rider page</a>
          </Link>{' '}
          after we've downloaded your laps history from Strava.
        </p>
        <p>
          Or if you want to go ride some laps, we'll also
          send you an email when everything is ready.
        </p>
      </div>
    )
  }

  renderError(id) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h3>Something went wrong.</h3>
        <p>
          An error occurred while we were building{' '}
          <Link href={`/rider?athleteId=${id}`} as={`/rider/${id}`}>
            <a>your rider page</a>
          </Link>.
        </p>
        <p>
          We're looking into it;{' '}
          please email <a href="mailto:info@themostlaps.com">info@themostlaps.com</a>{' '}
          with any questions. Thanks!
        </p>
      </div>
    );
  }

  renderReady(id) {
    return (
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
  }

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
    }

    return (<Layout
      pathname="/welcome"
      query={{}}
    >
      <h1>
        {this.state.status !== 'error' ?
          '🎉🚴 Welcome 🎉🚴' :
          '😞🚴 Welcome 🚴😞'
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
