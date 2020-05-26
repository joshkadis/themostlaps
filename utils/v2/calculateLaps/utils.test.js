const { locations } = require('../../../config');
const {
  getDistsToLocations,
  getCurrentLocation,
} = require('./utils');

test('getDistsToLocations', () => {
  const testPP = { prospectpark: locations.prospectpark };
  expect(getDistsToLocations([40.656716, -73.979606], testPP, 50000))
    .toStrictEqual({
      prospectpark: {
        locationCenter: [40.661990, -73.969681],
        locationName: 'prospectpark',
        maxLapRadius: 1400,
        distToCenter: 1100,
        distToPerimeter: -300, // my house is really close to the park :)
      },
    });
});

test('getCurrentLocation', () => {
  expect(getCurrentLocation({
    prospectpark: {
      distToCenter: 1000,
      distToPerimeter: 700,
    },
    centralpark: {
      distToCenter: 1000,
      distToPerimeter: 700,
    },
  })).toEqual('');

  expect(getCurrentLocation({
    prospectpark: {
      distToCenter: 1000,
      distToPerimeter: 1,
    },
    centralpark: {
      distToCenter: 1000,
      distToPerimeter: 700,
    },
  })).toEqual('');

  expect(getCurrentLocation({
    prospectpark: {
      distToCenter: 1000,
      distToPerimeter: 1,
    },
    centralpark: {
      distToCenter: 1000,
      distToPerimeter: -1,
    },
  })).toEqual('centralpark');
});
