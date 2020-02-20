const { defaultLocation } = require('../config');
const { allowedRankingTypes } = require('../api/apiConfig');
const { getLocationNames } = require('../utils/v2/locations');

const locationsReStr = getLocationNames().join('|');
const yearReStr = '(?:20[12]\\d)';
const monthReStr = '(?:0\\d)|1[0-2]';
const rankingTypeReStr = `${allowedRankingTypes.join('|')}|${yearReStr}`;


/**
 * Handle requests for `ranking` routes
 */
function handleRankingRoute(server, renderCallback) {
  server.get('/ranking', (req, res) => {
    res.redirect(301, `/ranking/${defaultLocation}`);
  });

  server.get(
    `/ranking/:location(${locationsReStr})/:reqPrimary($|${rankingTypeReStr})/:reqSecondary($|${monthReStr})`,
    (req, res) => {
      res.send(JSON.stringify(req.params));
      // renderCallback(req, res, '/ranking_v2', {
      //   query: req.query,
      //   params: req.params,
      // });
    },
  );

  server.get(
    `/ranking/:type(${allowedRankingTypes.join('|')})`,
    ({ params: { type, filter = false } }, res) => {
      // redirect to /ranking/{defaultLocation}/{rankingType}?/{rankingFilter}
      res.redirect(301, `/ranking/${defaultLocation}/${type}${filter ? `/${filter}` : ''}`);
    },
  );

  server.get(
    `/ranking/:year(${yearReStr})/:month(${monthReStr})?`,
    ({ params: { year, month = false } }, res) => {
      // redirect to /ranking/{defaultLocation}/{rankingType}?/{rankingFilter}
      res.redirect(301, `/ranking/${defaultLocation}/${year}${month ? `/${month}` : ''}`);
    },
  );
}

module.exports = handleRankingRoute;
