import PropTypes from 'prop-types';
import { socialLinks } from '../../config';
import * as styles from '../Navigation.css';
import { trackSocial } from '../../utils/analytics';

const SocialLink = ({ network, children }) => (
  <a
    className={styles.link}
    href={socialLinks[network]}
    rel="noopener noreferrer"
    target="_blank"
    onClick={() => trackSocial(network, 'link', socialLinks[network])}
  >
    {children}
  </a>
);

SocialLink.propTypes = {
  network: PropTypes.string,
  children: PropTypes.any,
};

export default SocialLink;
