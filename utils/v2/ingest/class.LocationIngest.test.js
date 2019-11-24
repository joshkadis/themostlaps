const Athlete = require('../../../schema/Athlete');
const LocationIngest = require('./class.LocationIngest');

let athleteDoc;
let locationIngest;

beforeEach(() => {
  athleteDoc = new Athlete();
  locationIngest = new LocationIngest(athleteDoc, 1532085);
});

test('setup', () => {
  expect(athleteDoc instanceof Athlete).toBe(true);
  expect(locationIngest.segmentId).toBe(1532085);
});
