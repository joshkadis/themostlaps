const validateApiRequest = require('./validateApiRequest');
const getRanking = require('./getRanking');
const { getAthletes } = require('./getAthletes');
const getTotals = require('./getTotals');
const getSearchUsers = require('./getSearchUsers');

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
async function initAPIRoutes(server) {
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
      async ({ params: { ids, locations } }) => getAthletes(ids, locations),
    );
  });

  server.get('/api/searchUsers', async (req, res) => {
    await handleAPIRequest(
      req,
      res,
      async ({ query: { complete } }) => getSearchUsers(!!complete),
    );
  });
}

module.exports = initAPIRoutes;
