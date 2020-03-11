/* eslint-disable react/prop-types */

import { stringify } from 'query-string';
import Router from 'next/router';

import MonthSplitButton from './MonthSplitButton';
import YearSplitButton from './YearSplitButton';
import MenuButton from './MenuButton';

import { getRankingPathname } from '../../../utils/v2/pages/ranking';
import { locations } from '../../../config';
import { allowedRankingTypes } from '../../../api/apiConfig';

const navigateFromMenu = (query) => {
  Router.push(
    `/ranking_v2?${stringify(query)}`,
    getRankingPathname(query),
  );
};

const LocationsButtons = () => (<div>
  {Object.values(locations).map(({ locationName }) => <MenuButton
      key={`location-button-${locationName}`}
      buttonKey='location'
      buttonVal={locationName}
      clickHandler={navigateFromMenu}
    >{locations[locationName].locationLabel}</MenuButton>)
  }
</div>);

// @todo Replace {type} with type mapped to label
// e.g. alltime to All Time
const TypesButtons = () => (<div>
  {allowedRankingTypes.map((type) => <MenuButton
      key={`type-button-${type}`}
      buttonKey='reqPrimary'
      buttonVal={type}
      clickHandler={navigateFromMenu}
    >{type}</MenuButton>)
  }
  <YearSplitButton clickHandler={navigateFromMenu}/>
  <MonthSplitButton clickHandler={navigateFromMenu}/>
</div>);

const RankingMenu = () => <nav>
  <LocationsButtons />
  <TypesButtons />
</nav>;

export default RankingMenu;
