/**
 * Translate provided params correct format
 * @param {Object} params
 * @returns {Object}
 */
function formatParamsForRender(params) {
  const {
    location: param1 = false,
    reqPrimary: param2 = false,
    reqSecondary: param3 = false,
  } = params;

  // /ranking
  if (!param1) {
    return {};
  }

  // /ranking/<location>/<reqPrimary>/<reqSecondary>
  if (param3) {
    return params;
  }

  if (isValidLocation(param1)) {
    if (param2) {
      // /ranking/<location>/<reqPrimary>
      return {
        location: param1,
        reqPrimary: param2,
      };
    }
    // /ranking/<location>
    return { location: param1 };
  }

  if (param2) {
    // /ranking/<reqPrimary>/<reqSecondary>
    return {
      location: defaultLocation,
      reqPrimary: param1,
      reqSecondary: param2,
    };
  }

  // /ranking/<reqPrimary>
  return {
    location: defaultLocation,
    reqPrimary: param1,
  };
}

/**
 * Handle requests for `ranking` routes
 */
const primaryRankings = allowedRankingTypes.join('|');
const primaryRegex = new RegExp(`${primaryRankings}|\\d{4}`)

function handleRankingRoute(server, renderCallback) {
  server.get(
    '/ranking/:location?/:reqPrimary?/:reqSecondary(\\d{2})?',
    (req, res) => {
      const { params } = req;
      const renderParams = formatParamsForRender(params);



     Cases:
     - /ranking/year
     - ranking/location
     - ranking/invalid...

     if ( Object.keys(params).length === 0) {
       // no params, all good
     }
     else if (params.location) {
       if (isValidLocation(params.location)) {
         // location only, all good
       } else if (primaryRegex.test(params.location)) {

         renderParams.location = defaultLocation;
         renderParams.reqPrimary = params.location;
       }
     }
     app.render(req, res, '/ranking_v2', {
       ...req.query,
       ...req.params,
     });
   },
 );

module.exports = {
  handleRankingRoute,
};
