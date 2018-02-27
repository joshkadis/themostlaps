import PropTypes from 'prop-types';
import Markdown from 'react-markdown';
import Link from 'next/link';
import Layout from '../components/Layout';
import aboutContent from 'raw-loader!../copy/about.md';
import termsContent from 'raw-loader!../copy/terms.md';
import privacyContent from 'raw-loader!../copy/privacy.md';
import convertMarkdownLink from '../components/lib/convertMarkdownLink';

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
    <Markdown
      source={pageContent(pageName)}
      escapeHtml={false}
      renderers={{ link: convertMarkdownLink }}
    />
  </Layout>
);

Page.getInitialProps = ({ query }) => ({ query, pageName: query.pageName });

Page.propTypes = {
  query: PropTypes.object.isRequired,
  pageName: PropTypes.string.isRequired,
};

export default Page;
