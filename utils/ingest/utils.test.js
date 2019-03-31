require('dotenv').config();
const { stringify } = require('query-string');
const { getStravaAuthRequestUrl } = require('./utils');
const { authRequestParams, stravaOauthUrl } = require('../../config');

describe('getStravaAuthRequestUrl', () => {
  it('forms correct URL for initial Stava authorization request', () => {
    let url = [
      stravaOauthUrl,
      '/authorize?',
      stringify(Object.assign(authRequestParams, {
        redirect_uri: 'http://localhost:3000/auth-callback',
        state: '/',
      })),
    ].join('');
    expect(url).toEqual(getStravaAuthRequestUrl());
  });
});
