require('dotenv').config();
const mongoose = require('mongoose');
const { Mockgoose } = require('mockgoose');
const Athlete = require('../schema/Athlete');
const {
  getEpochSecondsFromDateObj,
  getTimestampFromString,
  getDocFromMaybeToken,
} = require('./athleteUtils');

test('getEpochSecondsFromDateObj', () => {
  const baseTimeString = '2018-04-08T12:59:14';
  const baseTimestamp = 1523192354;

  const dateUTC = new Date(`${baseTimeString}Z`);
  expect(getEpochSecondsFromDateObj(dateUTC)).toBe(baseTimestamp);

  const dateLocal = new Date(`${baseTimeString}-04:00`);
  const localTimestamp = baseTimestamp + (4 * 60 * 60);
  expect(getEpochSecondsFromDateObj(dateLocal)).toBe(localTimestamp);
});

test('getTimestampFromString', () => {
  const baseTimeString = '2018-04-08T12:59:14';
  let baseTimestamp = 1523192354000;
  expect(getTimestampFromString(baseTimeString))
    .toEqual(baseTimestamp + (4 * 60 * 60 * 1000));
  expect(getTimestampFromString(`${baseTimeString}Z`))
    .toEqual(baseTimestamp);
  expect(getTimestampFromString(`${baseTimeString}-04:00`, { unit: 'ms' }))
    .toEqual(baseTimestamp + (4 * 60 * 60 * 1000));

  baseTimestamp = 1523192354;
  expect(getTimestampFromString(baseTimeString, { unit: 'seconds' }))
    .toEqual(baseTimestamp + (4 * 60 * 60));
  expect(getTimestampFromString(`${baseTimeString}Z`, { unit: 'seconds' }))
    .toEqual(baseTimestamp);
  expect(getTimestampFromString(`${baseTimeString}-04:00`, { unit: 'seconds' }))
    .toEqual(baseTimestamp + (4 * 60 * 60));

  expect(getTimestampFromString('baseTimeString'))
    .toEqual(false);
});
