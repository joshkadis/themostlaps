/* eslint-disable react/prop-types */
import Router from 'next/router';
import Button from '@material-ui/core/Button';
import SplitButton from '../../SplitButton';
import { RankingContext } from '../../../utils/v2/pages/ranking/rankingContext';
import { getRankingPathname } from '../../../utils/v2/pages/ranking';
import { locations } from '../../../config';
import { allowedRankingTypes } from '../../../api/apiConfig';

const MenuButton = ({
  buttonKey,
  buttonVal,
  children,
}) => (<RankingContext.Consumer>
  {(context) => {
    // Update route from this button
    // i.e. change the ranking view
    const navigateFromMenu = () => {
      const query = {
        ...context,
        [buttonKey]: buttonVal,
      };
      Router.push(
        getRankingPathname(query),
      );
    };
    // Button style
    const variant = context[buttonKey] === buttonVal
      ? 'contained'
      : 'outlined';

    return (<Button
      variant={variant}
      disableElevation
      onClick={navigateFromMenu}
    >{children}</Button>);
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
  <SplitButton />
</div>);

const RankingMenu = () => <nav>
  <Locations/>
  <Types />
</nav>;

export default RankingMenu;
