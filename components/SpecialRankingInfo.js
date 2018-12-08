import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { coldLapsPoints } from '../config';
const {
  tempPoints,
  precipPoints,
} = coldLapsPoints;
import * as styles from './Layout.css';

const SpecialRankingInfo = ({ filter }) => (
  <div className={styles['special-ranking-info__container']}>
    {filter === 'giro2018'&& (
      <Fragment>
        <p className="big">
          🇮🇹 May 4-27 with rest days on
          May 7, 14, and 21. 🍕
        </p>
        <p className="bigger">🏆 Prizes for the top 3 🏆</p>
      </Fragment>
    )}
    {filter === 'cold2019' && (
      <Fragment>
        <h4>Brave the elements. Ride laps. Get points.</h4>
        <div className={styles['special-ranking-info__cold2019--outer']}>
          <div className={styles['special-ranking-info__cold2019--inner']}>
            <span><em>Points per lap</em></span>
            {tempPoints.map(([ temp, value ]) =>
              <span style={{ textAlign: 'right' }}>&lt;{temp}°: {value}</span>
            )}
          </div>
          <div className={styles['special-ranking-info__cold2019--inner']}>
            <span><em>Bonus points!</em></span>
            {Object.keys(precipPoints).map((condition) =>
              <span style={{ textTransform: 'capitalize' }}>{condition}: +{precipPoints[condition]}</span>
            )}
          </div>
        </div>
        <p class="small" style={{ marginTop: '1em' }}>Stay warm and be safe. <a href="https://darksky.net/poweredby/">Powered by Dark Sky</a>.</p>
      </Fragment>
    )}
  </div>
);

SpecialRankingInfo.propTypes = {
  filter: PropTypes.string.isRequired,
};

export default SpecialRankingInfo;
