/* eslint-disable react/prop-types */

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
    onClick={disabled
      ? ({ target }) => target.blur()
      : onClick
    }
    style={style}
  >
    {children}
  </button>
);

export default Button;
