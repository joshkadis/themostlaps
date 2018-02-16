import * as styles from './Footer.css';
import { KadiscoSvg } from './lib/svg';

export default () => (
  <footer className={styles.footer}>
    <KadiscoSvg className={styles.kadiscoSvg}/>
    <span>&copy; 2018 <a href="https://kadisco.com">Josh Kadis</a></span>
    <img
      className={styles.stravaCredit}
      src="/static/img/api_logo_pwrdBy_strava_stack_white.png"
    />
  </footer>
);
