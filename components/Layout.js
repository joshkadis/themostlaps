import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';
import * as styles from './Layout.css';

/**
 * Page layout
 */
export default ({ children }) => (
  <div>
    <Head>
      <link rel="stylesheet" href="/_next/static/styles.css" />
    </Head>
    <Header />
    <div className={styles.main}>
      {children}
    </div>
    <Footer />
  </div>
);