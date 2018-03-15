const Athlete = require('../schema/Athlete');

/**
 * Get list of users for search
 *
 * @param {Bool} complete Should include complete: true per https://github.com/JedWatson/react-select#async-options
 * @return {Object}
 */
async function getSearchUsers(complete = true) {
  const athletes = await Athlete.find({}, '_id athlete.firstname athlete.lastname');
  const options = athletes.map(({ _id, athlete }) => ({
    value: _id,
    label: `${athlete.firstname} ${athlete.lastname}`,
  }));

  return {
    data: {
      complete,
      options,
    }
  };
}

module.exports = getSearchUsers;
