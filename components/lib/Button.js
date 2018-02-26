import classNames from 'classnames';
import * as styles from './Button.css';

const Button = ({
  className = false,
  onClick = null,
  style = {},
  children = '',
}) => (
  <button
    className={classNames(styles.button, className)}
    onClick={onClick}
    style={style}
  >
    {children}
  </button>
);

export default Button;
