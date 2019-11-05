/* global window,localStorage */
import React, { Component } from 'react';

class RiderPage extends Component {
  state = {

  }

  constructor(props) {
    super(props);
  }

  static async getInitialProps(context) {
    // Basic props from context

    // API request for primaryAthlete
  }

  render() {
    // primaryAthlete not found
      // "Sorry!"
      // <SearchUsers>

    // primaryAthlete not ready
      // <RiderPageHeader>

    // primaryAthlete has no laps
      // <RiderPageHeader>
      // "no laps!"

    // primaryAthlete can display
      // <RiderPageWelcome>?
      // <RiderPageHeader>
      // year === 'all'
        // ? <AllYears>
        // : <SingleYear>
      // <StavaLink>
  }
}

export default withLayout(RiderPage);
