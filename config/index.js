module.exports = {
  apiUrl: 'https://www.strava.com/api/v3',
  apiPerPage: 30,
  parkCenter: {
    latitude: 40.661990,
    longitude: -73.969681,
  },
  allowedRadius: 50000,
  minDistance: 3300,
  addMakeupLap: true, // Avoids excess API calls when ingesting new user
  devFetchActivities: 10,
  lapSegmentId: 5313629, // Prospect Park Race Lap
  sectionSegmentIds: [
    613198, // Prospect Park hill
    4435603, // Top of Prospect Park
    4362776, // Prospect Pure Downhill
    9699985, // Sprint between the lights
    740668, // E Lake Drive
  ],
  stravaClientId: 22415,
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
};
