import Navigation from './Navigation';
import * as styles from './Header.css';

export default ({ pathname }) => (
  <header className={styles.header}>
    <span className={styles.logo}>The Most Laps</span>
    <Navigation pathname={pathname}/>
  </header>
);