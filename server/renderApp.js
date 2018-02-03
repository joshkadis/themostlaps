module.exports = (req, res) => {
  const host = 'production' === process.env.NODE_ENV ?
    'https://themostlaps.com' : 'http://localhost:3000';

  const params = [
    `client_id=${process.env.CLIENT_ID}`,
    'response_type=code',
    'scope=view_private',
    `redirect_uri=${encodeURIComponent(host + '/auth-callback')}`,
  ];

  const linkUrl = 'https://www.strava.com/oauth/authorize?' + params.join('&');

  res.send(`<a href="${linkUrl}">authorize</a>`)
}
