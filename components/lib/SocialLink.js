import { socialLinks } from '../../config';
import * as styles from '../Navigation.css';
import { trackSocial } from '../../utils/analytics';

const SocialLink = ({ network, children }) => (
  <a
    className={styles.link}
    href={socialLinks[network]}
    target="_blank"
    onClick={() => trackSocial(network, 'link', socialLinks[network])}
  >
    {children}
  </a>
);

export default SocialLink;
