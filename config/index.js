module.exports = {
  apiUrl: 'https://www.strava.com/api/v3',
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
  prodDomain: 'themostlaps.herokuapp.com',
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
  ],
  modalTitles: {
    error: '😞 We\'re sorry. 😞',
    success: '🎉 You\'re all set! 🎉',
    signup: '🚴 Let\'s get started ! 🚴',
  },
};

