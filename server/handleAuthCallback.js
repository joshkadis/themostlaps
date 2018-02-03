require('isomorphic-fetch');

module.exports = (req, res) => {
  console.log(req.query);
  if (req.query.error) {
    res.send(`Error $req.query.error}`);
    return;
  }

  const body = [
    `client_id=${process.env.CLIENT_ID}`,
    `client_secret=${process.env.CLIENT_SECRET}`,
    `code=${req.query.code}`,
  ].join('&');

  fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    body,
  }).then((response) => {
    console.log(`Response status ${response.status}`);
    return response.json();
  }).then((athlete) => {
    console.log(athlete);
  });


  res.send('hi');
};