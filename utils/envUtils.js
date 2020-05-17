function isLocalEnv() {
  return ['localhost', '127.0.0.1'].indexOf(process.env.APP_DOMAIN) !== -1;
}

function getEnvOrigin() {
  const protocol = isLocalEnv() ? 'http' : 'https';
  const port = isLocalEnv() && process.env.PORT
    ? `:${process.env.PORT}`
    : '';
  return `${protocol}://${process.env.APP_DOMAIN}${port}`;
}

module.exports = {
  isLocalEnv,
  getEnvOrigin,
};
