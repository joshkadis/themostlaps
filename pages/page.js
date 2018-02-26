import PropTypes from 'prop-types';
import Markdown from 'react-markdown';
import Layout from '../components/Layout';
import aboutContent from 'raw-loader!../copy/about.md';
import termsContent from 'raw-loader!../copy/terms.md';
import privacyContent from 'raw-loader!../copy/privacy.md';

const pageContent = (pageName) => {
  switch (pageName) {
    case 'about':
      return aboutContent;

    case 'terms':
      return termsContent;

    case 'privacy':
      return privacyContent;

    default:
      return `Page ${pageName} not found.`;
  }
};


const Page = ({ query, pageName }) => (
  <Layout
    pathname={`/${pageName}`}
    query={query}
  >
    <Markdown source={pageContent(pageName)} />
  </Layout>
);

Page.getInitialProps = ({ query }) => ({ query, pageName: query.pageName });

Page.propTypes = {
  query: PropTypes.object.isRequired,
  pageName: PropTypes.string.isRequired,
};

export default Page;
