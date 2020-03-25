/* eslint-disable react/prop-types */
import { useState } from 'react';
import { stringify } from 'query-string';
import Router from 'next/router';
import classNames from 'classnames';

import MonthSplitButton from './MonthSplitButton';
import YearSplitButton from './YearSplitButton';
import MenuButton from './MenuButton';
import * as styles from './RankingMenu.css';

import { getRankingPathname } from '../../../utils/v2/pages/ranking';
import { locations } from '../../../config';
import { allowedRankingTypes } from '../../../api/apiConfig';

const navigateFromMenu = (query) => {
  Router.push(
    `/ranking_v2?${stringify(query)}`,
    getRankingPathname(query),
  );
};

const LocationsButtons = () => (<div className={styles.RankingMenu__row}>
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
const TypesButtons = () => (<div className={styles.RankingMenu__row}>
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

function RankingMenu() {
  const [isCollapsed, setCollapsed] = useState(true);

  function toggleFilters({ target }) {
    setCollapsed(!isCollapsed);
    target.blur();
  }

  return (<>
    <div
      className={classNames(
        styles.RankingMenu__container,
        styles['RankingMenu__container--center'],
      )}
    >
      <button
        className={styles.RankingMenu__filtertoggle}
        onClick={toggleFilters }
      >
        {isCollapsed ? 'Show ' : 'Hide '}Filters
      </button>
    </div>
    <div className={classNames(
      styles.RankingMenu__outer,
      isCollapsed ? styles['RankingMenu__outer--collapsed'] : '',
    )}>
      <nav className={styles.RankingMenu__container}>
        <LocationsButtons />
        <TypesButtons />
      </nav>
    </div>
  </>);
}

export default RankingMenu;
