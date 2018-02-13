import Link from 'next/link';
import Markdown from 'react-markdown';
import Layout from '../components/Layout';
import pageContent from 'raw-loader!../copy/home.md';

const Index = ({ url, query }) => (
  <Layout
    url={url}
    query={query}
  >
    <Markdown source={pageContent} />
  </Layout>
);

Index.getInitialProps = ({ url, query }) => ({ url, query });

export default Index;
