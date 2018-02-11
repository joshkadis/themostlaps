import Header from './Header';
import Footer from './Footer';
import * as styles from './Layout.css';

/**
 * Page layout
 */
export default ({ children }) => (
  <div>
    <Header />
    <div className={styles.main}>
      {children}
    </div>
    <Footer />
  </div>
);