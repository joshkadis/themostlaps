/* eslint-disable react/prop-types */
import SplitButton from '../../SplitButton';
import { RankingContext } from '../../../utils/v2/pages/ranking/rankingContext';
import {
  isValidYear,
} from '../../../utils/dateTimeUtils';
import { button__deselected } from '../../lib/Button.css';
import { rankingStartYear } from '../../../config';

const yearOptions = [];
for (let yr = new Date().getFullYear(); yr >= rankingStartYear; yr -= 1) {
  yearOptions.push(yr);
}

const YearSplitButton = ({
  clickHandler = () => {},
}) => (<RankingContext.Consumer>
    {(context) => {
      const navigateToYear = (nextReqPrimary) => {
        if (nextReqPrimary !== context.reqPrimary) {
          clickHandler({
            ...context,
            reqPrimary: nextReqPrimary,
            reqSecondary: '',
          });
        }
      };

      const className = isValidYear(context.reqPrimary)
        ? ''
        : button__deselected;

      return (<SplitButton
        options={yearOptions}
        buttonClassName={className}
        onSelectOption={navigateToYear}
      />);
    }}
</RankingContext.Consumer>);

export default YearSplitButton;
