import PropTypes from 'prop-types';
import Link from 'next/link'
import classNames from 'classnames';
import * as styles from '../Layout.css';

const AthleteHeader = ({ img, firstname, lastname, className, reverse, linkId }) => (
  <div className={classNames(
    styles['athlete-header'],
    { [styles['athlete-header__reverse']]: reverse },
    className || false
  )}>
    <img className={styles['athlete-header__avatar']} src={img} />
    {!!linkId ?
        <Link href={`/rider?athleteId=${linkId}`} as={`/rider/${linkId}`}>
          <a className={styles['athlete-header__name']}>
            {firstname} {lastname}
          </a>
        </Link> :
      <span className={styles['athlete-header__name']}>{firstname} {lastname}</span>
    }
  </div>
);

AthleteHeader.defaultProps = {
  className: '',
  reverse: false,
  linkId: 0,
};

AthleteHeader.propTypes = {
  img: PropTypes.string.isRequired,
  firstname: PropTypes.string.isRequired,
  lastname: PropTypes.string.isRequired,
  className: PropTypes.string,
  reverse: PropTypes.bool,
  linkId: PropTypes.number
};

export default AthleteHeader;
