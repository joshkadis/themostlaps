const Athlete = require('../schema/Athlete');

module.exports = (req, res) => {
  if (!req.params.id || isNaN(parseInt(req.params.id, 10))) {
    res.send('bad id param');
  }

  console.log(`Getting athlete ${req.params.id}`);

  Athlete.findById(parseInt(req.params.id, 10), (err, athlete) => {
    if (err) throw err;
    console.log(athlete);
    res.send(`${athlete.firstname} ${athlete.lastname}
      <script>console.log(${JSON.stringify(athlete)});</script>
    `);
  });
};