const { GraphQLClient } = require('graphql-request');
const client = new GraphQLClient(process.env.GRAPHQL_ENDPOINT);

async function gqlQuery(query, variables = {}) {
  let result;
  try {
    return await client.request(query, variables);
  } catch (err) {
    console.error(JSON.stringify(err, undefined, 2))
    process.exit(1)
  }
}

async function getGqlAthlete(id, fields) {
  const query = await gqlQuery(`query {
    athlete(where: {strava_id: ${id}})
      ${fields}
  }`);
  return query.athlete;
}

async function getGqlActivity(id, fields) {
  const query = await gqlQuery(`query {
  activity(
    where: { strava_id: ${id} }
  )
    ${fields}
}`);
  return query.athlete;
}

module.exports = {
  gqlQuery,
  getGqlAthlete,
  getGqlActivity,
};
