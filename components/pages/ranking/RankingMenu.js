import { RankingContext } from '../../../utils/v2/pages/ranking/rankingContext';

const RankingMenu = () => (<RankingContext.Consumer>
  {({ location, reqPrimary, reqSecondary }) => (
    <p>{`${location} | ${reqPrimary} | ${reqSecondary}`}</p>
  )}
</RankingContext.Consumer>);

export default RankingMenu;
