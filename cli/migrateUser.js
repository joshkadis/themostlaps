const Athlete = require('../schema/Athlete');
const gqlQuery = require('../migration/gqlQuery');

const reformatAthleteSchema = (oldSchema) => ({
  strava_id:
  firstname: String!
  lastname: String!
  photo: String!
  email: String
  status: String! @default(value: "ingesting")
  notifications: Boolean! @default(value: true)
  access_token: String! @unique
  refresh_token: String
  expires_at: Int
  migrated_token: Boolean! @default(value: false)

});

async function migrateUser(user, force) {
  const gqlUser = await gqlQuery(`query {
    athlete(where: {strava_id: ${user}}) {
        strava_id
    }
  }`);

  console.log(gqlUser);

  if (gqlUser.athlete) {
    if (force) {
      const gqlUserDeleted = await gqlQuery(`mutation {
        deleteAthlete(where: {strava_id: ${user}}) {
            strava_id
        }
      }`);
      console.log(gqlUserDeleted);
      if (!gqlUserDeleted.deleteAthlete) {
        console.error('Failed to delete user via GraphQL API');
        process.exit(1);
      }
    } else {
      console.log(`User ${user} already exists on GraphQL server. Use --force flag to overwrite.`)
      process.exit(0);
    }
  }

  const athleteDoc = await Athlete.findById(user);
  if (!athleteDoc) {
    console.log(`User ${user} was not found in MongoDB`)
    process.exit(0);
  }

  console.log(athleteDoc.toJSON());

  process.exit(0);
}

module.exports = migrateUser;
