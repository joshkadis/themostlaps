const Athlete = require('../schema/Athlete');
const Activity = require('../schema/Activity');

/**
 * Delete user and their activities from the database
 * Then exit the process
 *
 * @param {Number} id
 */
module.exports = (id) => {
  Athlete.findByIdAndRemove(id, (err) => {
    if (err) throw err;
    console.log(`Deleted user ${id} from athletes collection`);
    Activity.deleteMany({ athlete_id: id }, (err) => {
      if (err) throw err;
      console.log(`Deleted user ${id}'s activities`);
      process.exit(0);
    })
  });
};
