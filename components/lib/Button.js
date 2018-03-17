import classNames from 'classnames';
import * as styles from './Button.css';

const Button = ({
  className = false,
  onClick = null,
  style = {},
  children = '',
  disabled,
}) => (
  <button
    className={classNames(
      styles.button,
      { [styles.button__disabled]: disabled },
      className,
    )}
    onClick={onClick}
    style={style}
  >
    {children}
  </button>
);

export default Button;
