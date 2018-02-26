import PropTypes from 'prop-types';
import Markdown from 'react-markdown';
import Layout from '../components/Layout';
import pageContent from 'raw-loader!../copy/about.md';

const About = ({ query }) => (
  <Layout
    pathname="/about"
    query={query}
  >
    <Markdown source={pageContent} />
  </Layout>
);

About.getInitialProps = ({ query }) => ({ query });

About.propTypes = {
  query: PropTypes.object.isRequired,
};

export default About;
