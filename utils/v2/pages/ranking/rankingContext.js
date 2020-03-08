import React from 'react';
import { defaultLocation } from '../../../../config';

const DEFAULT_RANKING = 'alltime';

export const RankingContext = React.createContext({
  location: defaultLocation,
  reqPrimary: DEFAULT_RANKING,
  reqSecondary: '',
});
