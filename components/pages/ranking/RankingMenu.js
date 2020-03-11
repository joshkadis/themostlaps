/* eslint-disable react/prop-types */
import { Fragment } from 'react';
import { stringify } from 'query-string';
import Router from 'next/router';

import Button from '../../lib/Button';
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
import { button__deselected } from '../../lib/Button.css';

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

const MenuButton = ({
  buttonKey,
  buttonVal,
  children,
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
      onClick={() => navigateFromMenu(query)}
      className={className}
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

// @todo for this thing:
// - Don't include future months for current year
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
          && (<ClearMonthButton onClick={() => navigateFromMenu({
            ...context,
            reqSecondary: '',
          })}>
            clear month
          </ClearMonthButton>)
        }
      </Fragment>);
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
