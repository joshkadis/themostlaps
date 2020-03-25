/* eslint-disable react/prop-types */
import Button from '../../lib/Button';
import { RankingContext } from '../../../utils/v2/pages/ranking/rankingContext';
import {
  isValidYear,
} from '../../../utils/dateTimeUtils';
import { button__deselected } from '../../lib/Button.css';

const MenuButton = ({
  buttonKey,
  buttonVal,
  children,
  clickHandler = () => {},
}) => (<RankingContext.Consumer>
  {(context) => {
    const className = context[buttonKey] === buttonVal
      ? ''
      : button__deselected;

    const query = {
      ...context,
      [buttonKey]: buttonVal,
      reqSecondary: isValidYear(buttonVal)
        ? context.reqSecondary
        : '',
    };
    return (<Button
      onClick={() => clickHandler(query)}
      className={className}
    >{children}</Button>);
  }}
</RankingContext.Consumer>);

export default MenuButton;
