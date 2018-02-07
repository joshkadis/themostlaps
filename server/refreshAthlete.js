const Activity = require('../schema/Activity');

module.exports = (req, res) => {
  if (!req.params.id || isNaN(parseInt(req.params.id, 10))) {
    res.send('bad id param');
  }

  console.log(`Getting activities for athlete ${req.params.id}`);

  Activity.find({ athlete_id: req.params.id }, (err, activities) => {
    res.send(`Found ${activities.length} activities`);
  });
};