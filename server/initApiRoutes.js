const validateApiRequest = require('../utils/server/validateApiRequest');
// v1
const getRanking = require('../api/getRanking');
const getAthletes = require('../api/getAthletes');
const getTotals = require('../api/getTotals');
const getSearchUsers = require('../api/getSearchUsers');
// v2
const { getAthletes: v2GetAthletes } = require('../api/v2/getAthletes');
const { getRanking: v2GetRanking } = require('../api/v2/getRanking');

/**
 * Validate and fetch data for API request
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Func} fetchData Function to fetch response data, takes req as argument
 */
async function handleAPIRequest(req, res, fetchData) {
  const validation = validateApiRequest(req.hostname, req.query.key || null);
  if (!validation.valid || validation.error) {
    res.status(403).json(validation.error || 'unknown validation error');
    return;
  }

  const responseData = await fetchData(req);

  const status = responseData.error ? 500 : 200;
  res.status(status).json(responseData.error
    ? responseData
    : responseData.data);
}

/**
 * Init API routes
 *
 * @param {Express} server
 */
async function initApiRoutes(server) {
  /**
   * v1 routes
   */
  server.get('/api/totals', async (req, res) => {
    await handleAPIRequest(
      req,
      res,
      async () => getTotals(),
    );
  });

  server.get('/api/ranking/:type', async (req, res) => {
    await handleAPIRequest(
      req,
      res,
      async ({ params: { type }, query }) => getRanking(type, query),
    );
  });

  server.get('/api/athletes/:ids', async (req, res) => {
    await handleAPIRequest(
      req,
      res,
      async ({ params: { ids } }) => getAthletes(ids),
    );
  });

  server.get('/api/searchUsers', async (req, res) => {
    await handleAPIRequest(
      req,
      res,
      async ({ query: { complete } }) => getSearchUsers(!!complete),
    );
  });

  /**
   * v2 routes
   */
  server.get('/api/v2/athletes/:ids', async (req, res) => {
    await handleAPIRequest(
      req,
      res,
      async ({ params }) => v2GetAthletes(params.ids),
    );
  });

  server.get('/api/v2/ranking/:reqPrimary/:reqSecondary?', async (req, res) => {
    await handleAPIRequest(
      req,
      res,
      async ({ params, query }) => v2GetRanking(params, query),
    );
  });
}

module.exports = initApiRoutes;
