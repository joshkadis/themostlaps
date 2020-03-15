/* eslint-disable react/prop-types */
import { Fragment } from 'react';
import SplitButton from '../../SplitButton';
import Button from '../../lib/Button';
import { RankingContext } from '../../../utils/v2/pages/ranking/rankingContext';
import {
  isValidYear,
  isValidMonth,
  getMonthName,
  timePartString,
} from '../../../utils/dateTimeUtils';
import { button__deselected } from '../../lib/Button.css';

const monthOptions = new Array(12)
  .fill(1)
  .map((val, idx) => getMonthName(val + idx));

const ClearMonthButton = ({ onClick }) => (
  <Button
    onClick={onClick}
    className='link'
    style={{
      background: 'none',
      border: 'none',
      fontSize: '.8em',
    }}
  >
    clear month
  </Button>
);

// @todo for this thing:
// - Don't include future months for current year
const MonthSplitButton = ({
  clickHandler = () => {},
}) => (<RankingContext.Consumer>
    {(context) => {
      const navigateToMonth = (nextMonthName) => {
        const nextMonthNum = monthOptions.indexOf(nextMonthName) + 1;
        if (nextMonthNum !== Number(context.reqSecondary)) {
          clickHandler({
            ...context,
            reqSecondary: timePartString(nextMonthNum),
          });
        }
      };
      const className = isValidMonth(context.reqSecondary)
        ? ''
        : button__deselected;

      return (<Fragment>
        <SplitButton
          options={monthOptions}
          buttonClassName={className}
          onSelectOption={navigateToMonth}
          shouldDisable={!isValidYear(context.reqPrimary)}
        />
        {isValidYear(context.reqPrimary)
          && isValidMonth(context.reqSecondary)
          && (<ClearMonthButton onClick={() => clickHandler({
            ...context,
            reqSecondary: '',
          })}>
            clear month
          </ClearMonthButton>)
        }
      </Fragment>);
    }}
</RankingContext.Consumer>);

export default MonthSplitButton;
