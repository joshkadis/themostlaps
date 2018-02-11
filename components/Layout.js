import Header from './Header';
import Footer from './Footer';

/**
 * Page layout
 */
export default ({ children }) => (
  <div>
    <Header />
    <div class="main">
      {children}
    </div>
    <Footer />
  </div>
);