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
      <meta charset="utf-8" />
      <meta http-equiv="x-ua-compatible" content="ie=edge" />
      <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no, maximum-scale=1" />
      <link rel="stylesheet" href="/_next/static/style.css" />
    </Head>
    <Header />
    <div className={styles.main}>
      {children}
    </div>
    <Footer />
  </div>
);