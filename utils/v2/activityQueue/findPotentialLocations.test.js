const { findPotentialLocations } = require('./findPotentialLocations');

const middleOfTheAtlantic = [38.681875, 69.020277];
const dumbo = [40.703381, -73.990618];
const oceanGroveNJ = [40.21503, -74.00592];

describe('tests for potential locations', () => {
  test('Close to all locations but too short', () => {
    expect(findPotentialLocations({
      start_latlng: dumbo,
      end_latlng: dumbo,
      distance: 200,
      id: 123,
    })).toEqual([]);
  });

  test('Close to all locations but only long enough for one', () => {
    expect(findPotentialLocations({
      start_latlng: dumbo,
      end_latlng: dumbo,
      distance: 7000,
      id: 345,
    })).toEqual(['prospectpark']);
  });

  test('Too far from any location', () => {
    expect(findPotentialLocations({
      start_latlng: middleOfTheAtlantic,
      end_latlng: middleOfTheAtlantic,
      distance: 200000,
      id: 123,
    })).toEqual([]);
  });

  test('Starts close to all locations', () => {
    expect(findPotentialLocations({
      start_latlng: dumbo,
      end_latlng: middleOfTheAtlantic,
      distance: 200000,
      id: 123,
    })).toEqual(['prospectpark', 'centralpark']);
  });

  test('Ends close to all locations', () => {
    expect(findPotentialLocations({
      start_latlng: middleOfTheAtlantic,
      end_latlng: dumbo,
      distance: 200000,
      id: 123,
    })).toEqual(['prospectpark', 'centralpark']);
  });

  test('Starts close to one location', () => {
    expect(findPotentialLocations({
      start_latlng: oceanGroveNJ,
      end_latlng: middleOfTheAtlantic,
      distance: 200000,
      id: 123,
    })).toEqual(['prospectpark']);
  });

  test('Ends close to one location', () => {
    expect(findPotentialLocations({
      start_latlng: middleOfTheAtlantic,
      end_latlng: oceanGroveNJ,
      distance: 200000,
      id: 123,
    })).toEqual(['prospectpark']);
  });
});
