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

Welcome.getInitialProps = ({ query }) => ({ ...query });

Welcome.defaultProps = {
  id: 541773,
  firstname: 'josh',
};

Welcome.propTypes = {
  id: PropTypes.number.isRequired,
  firstname: PropTypes.string.isRequired,
};

export default Welcome;
