import PropTypes from 'prop-types';
import React, { Component, Fragment } from 'react';
import Button from './lib/Button';
import { CircleUp, CircleDown } from './lib/svg';
import { coldLapsPoints } from '../config';
const {
  tempPoints,
  precipPoints,
} = coldLapsPoints;
import * as styles from './Layout.css';

class SpecialRankingInfo extends Component {

  state = {
    isExpanded: true,
  };

  toggleExpand = (evt) => {
    evt.stopPropagation();
    this.setState({ isExpanded: !this.state.isExpanded });
  }

  render() {
    const { filter } = this.props;
    const { isExpanded } = this.state;

    return (<div className={styles['special-ranking-info__container']}>
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
          <Button onClick={this.toggleExpand} className={styles['special-ranking-info__button--icon']}>
            {isExpanded ? 'Hide Points' : 'Points Breakdown'}
            {isExpanded ?
              <CircleUp /> :
              <CircleDown />}
          </Button>
          {isExpanded && <Fragment>
            <div className={styles['special-ranking-info__cold2019--outer']}>
              <div className={styles['special-ranking-info__cold2019--inner']}>
                <span><em>Points per lap</em></span>
                {tempPoints.map(([ temp, value ]) =>
                  <span>
                    <span className={styles['special-ranking-info__points--key']}>&lt;{temp}°:</span>
                    {value}
                  </span>
                )}
              </div>
              <div className={styles['special-ranking-info__cold2019--inner']}>
                <span><em>Bonus per lap</em></span>
                {Object.keys(precipPoints).map((condition) =>
                  <span style={{ textTransform: 'capitalize' }}>
                    <span className={styles['special-ranking-info__points--key']}>{condition}:</span>
                    +{precipPoints[condition]}
                  </span>
                )}
              </div>
            </div>
            <p class="small" style={{ margin: '1rem 0 0' }}>Stay warm and be safe. <a href="https://darksky.net/poweredby/">Powered by Dark Sky</a>.</p>
          </Fragment>}
        </Fragment>
      )}
    </div>);
  }
}

SpecialRankingInfo.propTypes = {
  filter: PropTypes.string.isRequired,
};

export default SpecialRankingInfo;
