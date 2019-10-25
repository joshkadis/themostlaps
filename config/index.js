const prospectPark = require('./locations/prospectpark');

module.exports = {
  apiUrl: 'https://www.strava.com/api/v3',
  defaultLocation: 'prospectPark',
  locations: [
    prospectPark,
  ],
  apiPerPage: 30,
  authRequestParams: {
    client_id: process.env.CLIENT_ID,
    response_type: 'code',
    scope: 'read_all,activity:read_all,profile:read_all',
    approval_prompt: 'auto',
    // redirect_uri must be provided
    // state must be provided
  },
  breakpointPx: 800,
  refreshSchedule: {
    hour: 8, // GMT
    minute: 0,
  },
  defaultAthleteFields: [
    'id',
    'athlete.firstname',
    'athlete.lastname',
    'athlete.profile',
    'stats',
    'status',
  ],
  modalTitles: {
    signup: '🚴 Here we go! 🚴',
  },
  locale: 'en-US',
  socialLinks: {
    twitter: 'https://twitter.com/themostlaps',
    instagram: 'https://instagram.com/themostlaps',
  },
  notificationTypes: ['monthly'],
  notificationActions: ['sub', 'unsub'],
  notificationSubscribeAction: 'sub',
  timezoneOffset: 240, // Minutes from local time *to* UTC
  testAthleteIds: [541773],
  conditionPadding: 150,
  darkSkyRequestOpts: {
    exclude: 'minutely,hourly,alerts,flags',
    lang: 'en',
    units: 'us',
  },
  coldLapsPoints: {
    startActivity: 1978706706,
    startTimestamp: 1542844800,
    tempPoints: [
      [40, 1],
      [35, 1.5],
      [30, 2],
      [25, 2.5],
      [10, 3.5],
    ],
    precipPoints: {
      rain: 2,
      snow: 2.5,
      sleet: 3,
    },
  },
  tokenExpirationBuffer: 3600,
  stravaOauthUrl: 'https://www.strava.com/oauth',
  tokenRefreshGrantType: 'refresh_token',
};
