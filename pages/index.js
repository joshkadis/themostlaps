import Link from 'next/link';
import Markdown from 'react-markdown';
import Layout from '../components/Layout';
import pageContent from 'raw-loader!../copy/home.md';

export default () => (
  <Layout>
    <Markdown source={pageContent} />
  </Layout>
);
