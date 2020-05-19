/* eslint-disable react/prop-types */
import { useState } from 'react';
import { stringify } from 'query-string';
import Router from 'next/router';
import classNames from 'classnames';

import MonthSplitButton from './MonthSplitButton';
import YearSplitButton from './YearSplitButton';
import MenuButton from './MenuButton';
import LocationsButtons from '../../LocationsButtons';
import * as styles from './RankingMenu.css';

import {
  getRankingPathname,
  getFilterLabel,
} from '../../../utils/v2/pages/ranking';
import { allowedRankingTypes } from '../../../api/apiConfig';

const navigateFromMenu = (query) => {
  Router.push(
    `/ranking?${stringify(query)}`,
    getRankingPathname(query),
  );
};

// @todo Replace {type} with type mapped to label
// e.g. alltime to All Time
const TypesButtons = () => (<div className={styles.RankingMenu__row}>
  {allowedRankingTypes.map((type) => <MenuButton
    key={`type-button-${type}`}
    buttonKey='reqPrimary'
    buttonVal={type}
    clickHandler={navigateFromMenu}
  >{getFilterLabel(type)}</MenuButton>)
  }
  <YearSplitButton clickHandler={navigateFromMenu} />
  <MonthSplitButton clickHandler={navigateFromMenu} />
</div>);

function RankingMenu() {
  const [isCollapsed, setCollapsed] = useState(false);

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
        onClick={toggleFilters}
      >
        {isCollapsed ? 'Show ' : 'Hide '}Filters
      </button>
    </div>
    <div className={classNames(
      styles.RankingMenu__outer,
      isCollapsed ? styles['RankingMenu__outer--collapsed'] : '',
    )}>
      <nav className={styles.RankingMenu__container}>
        <LocationsButtons onClick={navigateFromMenu} />
        <TypesButtons />
      </nav>
    </div>
  </>);
}

export default RankingMenu;
