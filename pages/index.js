import Link from 'next/link';
import PropTypes from 'prop-types';
import Markdown from 'react-markdown';
import Layout from '../components/Layout';
import pageContent from 'raw-loader!../copy/home.md';
import { getPathnameFromContext } from '../utils';

const Index = ({ pathname, query }) => (
  <Layout
    pathname={pathname}
    query={query}
  >
    <Markdown source={pageContent} />
  </Layout>
);

Index.getInitialProps = (context) => ({
  pathname: getPathnameFromContext(context),
  query: context.query,
});

Index.propTypes = {
  query: PropTypes.object.isRequired,
  pathname: PropTypes.string.isRequired,
};

export default Index;
