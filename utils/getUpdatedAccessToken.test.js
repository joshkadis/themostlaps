require('dotenv').config();
const { getUpdatedAccessToken } = require('./getUpdatedAccessToken');
const { tokenExpirationBuffer } = require('../config');

const EXPIRES_AT = 1000;

/**
  Mock an Athlete document.
  get() and set() only work for top-level properties
**/
const getMockAthleteDoc = () => ({
  get(key) { return this[key] },
  set(key, value = null) {
    if (typeof key === 'string' && value) {
      this[key] = value
    } else if (typeof key === 'object') {
      Object.keys(key).forEach((_key) => {
        this[_key] = key[_key];
      });
    }
  },
  save() { /* nothing to see here */ },
  access_token: 'FOREVER_TOKEN',
  token_type: 'Bearer',
  athlete: {
    id: 1245,
  },
  refresh_token: 'INITIAL_REFRESH_TOKEN',
  expires_at: EXPIRES_AT,
  state: 'STATE',
  _id: 1245,
});

describe('getUpdatedAccessToken', () => {
  beforeEach(() => {
    fetch.resetMocks();
    jest.resetModules();
  });

  it('mocks Athlete schema', () => {
    const testMockAthleteDoc = getMockAthleteDoc();
    expect(testMockAthleteDoc.get('access_token')).toEqual('FOREVER_TOKEN');
    testMockAthleteDoc.set('access_token', 'GOODBYE_TOKEN');
    expect(testMockAthleteDoc.get('access_token')).toEqual('GOODBYE_TOKEN');
    expect(testMockAthleteDoc.get('token_type')).toEqual('Bearer');
  });

  it('returns forever token if not migrated yet', async () => {
    const athleteDoc = getMockAthleteDoc()
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
    }))

    const athleteDoc = getMockAthleteDoc();
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
    }))

    const athleteDoc = getMockAthleteDoc()
    athleteDoc.set('access_token', 'INITIAL_ACCESS_TOKEN');
    const now = (EXPIRES_AT - tokenExpirationBuffer) - 5;
    const access_token = await getUpdatedAccessToken(athleteDoc, false, now);

    expect(access_token).toEqual('INITIAL_ACCESS_TOKEN');
    expect(athleteDoc.get('refresh_token')).toEqual('INITIAL_REFRESH_TOKEN');
  });
});
