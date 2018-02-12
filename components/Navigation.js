import Link from 'next/link';
import classNames from 'classnames';
import { lapSegmentId } from '../config';
import * as styles from './Navigation.css';

export default () => (
  <div>
    <nav>
      <Link as="/prospectpark" href={`/park?segment=${lapSegmentId}`}>
        <a className={styles.link}>Prospect Park</a>
      </Link>
      <Link href="/about">
        <a className={styles.link}>About</a>
      </Link>
      <Link href="/help">
        <a className={styles.link}>Help</a>
      </Link>
      <span className={classNames(styles.link, styles.ctaLink)}>
        Post Your Laps
      </span>
    }
  </nav>
  </div>
);
