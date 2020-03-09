/* eslint-disable react/prop-types */
import { stringify } from 'query-string';
import Router from 'next/router';
import Button from '@material-ui/core/Button';
import SplitButton from '../../SplitButton';
import { RankingContext } from '../../../utils/v2/pages/ranking/rankingContext';
import { getRankingPathname } from '../../../utils/v2/pages/ranking';
import { locations, rankingStartYear } from '../../../config';
import { allowedRankingTypes } from '../../../api/apiConfig';
import {
  isValidYear,
  getMonthName,
  timePartString,
  isValidMonth,
} from '../../../utils/dateTimeUtils';

const yearOptions = [];
for (let yr = new Date().getFullYear(); yr >= rankingStartYear; yr -= 1) {
  yearOptions.push(yr);
}
const monthOptions = new Array(12)
  .fill(1)
  .map((val, idx) => getMonthName(val + idx, 3));

const navigateFromMenu = (query) => {
  Router.push(
    `/ranking_v2?${stringify(query)}`,
    getRankingPathname(query),
  );
};


const MenuButton = ({
  buttonKey,
  buttonVal,
  children,
}) => (<RankingContext.Consumer>
  {(context) => {
    // Update route from this button
    // i.e. change the ranking view
    // Button style
    const variant = context[buttonKey] === buttonVal
      ? 'contained'
      : 'outlined';

    const query = {
      ...context,
      [buttonKey]: buttonVal,
    };
    return (<Button
      variant={variant}
      disableElevation
      onClick={() => navigateFromMenu(query)}
    >{children}</Button>);
  }}
</RankingContext.Consumer>);

const YearSplitButton = () => (<RankingContext.Consumer>
    {(context) => {
      const navigateToYear = (nextReqPrimary) => {
        if (nextReqPrimary !== context.reqPrimary) {
          navigateFromMenu({
            ...context,
            reqPrimary: nextReqPrimary,
            reqSecondary: '',
          });
        }
      };
      return (<SplitButton
        options={yearOptions}
        variant={isValidYear(context.reqPrimary) ? 'contained' : 'outlined'}
        onSelectOption={navigateToYear}
      />);
    }}
</RankingContext.Consumer>);

const MonthSplitButton = () => (<RankingContext.Consumer>
    {(context) => {
      const navigateToMonth = (nextMonthName) => {
        const nextMonthNum = monthOptions.indexOf(nextMonthName) + 1;
        if (nextMonthNum !== Number(context.reqSecondary)) {
          navigateFromMenu({
            ...context,
            reqSecondary: timePartString(nextMonthNum),
          });
        }
      };
      return (<SplitButton
        options={monthOptions}
        variant={isValidMonth(context.reqSecondary) ? 'contained' : 'outlined'}
        onSelectOption={navigateToMonth}
      />);
    }}
</RankingContext.Consumer>);

const Locations = () => (<div>
  {Object.values(locations).map(({ locationName }) => <MenuButton
      key={`location-button-${locationName}`}
      buttonKey='location'
      buttonVal={locationName}
    >{locations[locationName].locationLabel}</MenuButton>)
  }
</div>);

// @todo Replace {type} with type mapped to label
// e.g. alltime to All Time
const Types = () => (<div>
  {allowedRankingTypes.map((type) => <MenuButton
      key={`type-button-${type}`}
      buttonKey='reqPrimary'
      buttonVal={type}
    >{type}</MenuButton>)
  }
  <YearSplitButton />
  <MonthSplitButton />
</div>);

const RankingMenu = () => <nav>
  <Locations/>
  <Types />
</nav>;

export default RankingMenu;
