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

module.exports = gqlQuery;
