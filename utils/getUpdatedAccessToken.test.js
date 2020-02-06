require('dotenv').config();
const {
  getUpdatedAccessToken,
} = require('./getUpdatedAccessToken');
const { tokenExpirationBuffer } = require('../config');
const Athlete = require('../schema/Athlete');

const EXPIRES_AT = 1000;

const createAthleteDoc = () => {
  const time = new Date().toISOString();
  const doc = new Athlete({
    _id: 1245,
    access_token: 'FOREVER_TOKEN',
    refresh_token: 'INITIAL_REFRESH_TOKEN',
    expires_at: EXPIRES_AT,
    token_type: 'Bearer',
    athlete: {
      id: 1245,
    },
    status: 'ready',
    state: 'STATE',
    last_updated: time,
    created: time,
    last_refreshed: new Date().valueOf(),
    stats: {},
    stats_version: 'v2',
  });
  return doc;
};

describe('getUpdatedAccessToken', () => {
  let athleteDoc;
  beforeEach(() => {
    fetch.resetMocks();
    athleteDoc = createAthleteDoc();
  });

  it('returns forever token if not migrated yet', async () => {
    athleteDoc.set({ refresh_token: null, expires_at: null });
    const access_token = await getUpdatedAccessToken(athleteDoc);

    expect(access_token).toEqual(athleteDoc.get('access_token'));
    expect(access_token).toEqual('FOREVER_TOKEN');
  });

  it('refreshes access_token from Strava if expired', async () => {
    fetch.mockResponseOnce(JSON.stringify({
      token_type: 'Bearer',
      access_token: 'UPDATED_ACCESS_TOKEN',
      athlete: {
        id: 1245,
      },
      refresh_token: 'UPDATED_REFRESH_TOKEN',
      expires_at: EXPIRES_AT,
      state: 'STATE',
    }));

    expect(athleteDoc.get('access_token')).toEqual('FOREVER_TOKEN');
    expect(athleteDoc.get('refresh_token')).toEqual('INITIAL_REFRESH_TOKEN');

    let now = EXPIRES_AT - tokenExpirationBuffer + 5;
    const result = await getUpdatedAccessToken(athleteDoc, false, now);
    const access_token = result;
    expect(access_token).toEqual('UPDATED_ACCESS_TOKEN');
    expect(athleteDoc.get('refresh_token')).toEqual('UPDATED_REFRESH_TOKEN');
  });

  it('returns saved token if not expired', async () => {
    fetch.mockResponseOnce(JSON.stringify({
      token_type: 'Bearer',
      access_token: 'SHOULD_NEVER_SEE_THIS_ACCESS_TOKEN',
      athlete: {
        id: 1245,
      },
      refresh_token: 'SHOULD_NEVER_SEE_THIS_REFRESH_TOKEN',
      expires_at: EXPIRES_AT,
      state: 'STATE',
    }));

    athleteDoc.set('access_token', 'INITIAL_ACCESS_TOKEN');
    const now = (EXPIRES_AT - tokenExpirationBuffer) - 5;
    const access_token = await getUpdatedAccessToken(athleteDoc, false, now);

    expect(access_token).toEqual('INITIAL_ACCESS_TOKEN');
    expect(athleteDoc.get('refresh_token')).toEqual('INITIAL_REFRESH_TOKEN');
  });
});

// describe('maybeDeauthorizeAthlete', () => {
//   beforeEach(() => {
//     fetch.resetMocks();
//     jest.resetModules();
//   });
//   it('deauthorizes user after failed API call', async () => {
//     let athleteDoc = getMockAthleteDoc();
//     expect(athleteDoc.get('status')).toEqual('ready');
//
//     fetch.mockResponses(
//       [
//         '{"something": "does not matter"}',
//         { status: 401 },
//       ],
//       [
//         '{"something": "does not matter"}',
//         { status: 200 },
//       ],
//       [
//         '{"message":"Bad Request","errors":[{"resource":"RefreshToken","field":"code","code":"invalid"}]}',
//         { status: 400 },
//       ],
//     );
//
//     let response = await fetch('https://fakeapi.com');
//     let responseStatus = response.status;
//     let responseJson = await response.json();
//     let result = await maybeDeauthorizeAthlete(responseJson, responseStatus, athleteDoc);
//     expect(result).toBe(true);
//     expect(athleteDoc.get('status')).toEqual('deauthorized');
//
//     athleteDoc = getMockAthleteDoc();
//     response = await fetch('https://fakeapi.com');
//     responseStatus = response.status;
//     responseJson = await response.json();
//     result = await maybeDeauthorizeAthlete(responseJson, responseStatus, athleteDoc);
//     expect(result).toBe(false);
//     expect(athleteDoc.get('status')).toEqual('ready');
//
//     athleteDoc = getMockAthleteDoc();
//     response = await fetch('https://fakeapi.com');
//     responseStatus = response.status;
//     responseJson = await response.json();
//     result = await maybeDeauthorizeAthlete(responseJson, responseStatus, athleteDoc);
//     expect(result).toBe(true);
//     expect(athleteDoc.get('status')).toEqual('deauthorized');
//   });
// });
