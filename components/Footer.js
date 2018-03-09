import * as styles from './Footer.css';
import GA from './GA';

export default () => (
  <footer className={styles.footer}>
    <span>&copy; 2018 <a href="https://kadisco.com">Josh Kadis</a></span>
    <img
      className={styles.stravaCredit}
      src="/static/img/api_logo_pwrdBy_strava_horiz_white.png"
    />
    <GA />
  </footer>
);
