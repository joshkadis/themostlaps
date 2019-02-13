require('dotenv').config();
const mongoose = require('mongoose');
const Athlete = require('../schema/Athlete');
const {
  getEpochSecondsFromDateObj,
  getDocFromMaybeToken
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

test('getDocFromMaybeToken', async () => {
  const athlete = new Athlete({ _id: 1, access_token: 'my_token' });
  expect(athlete instanceof mongoose.Document).toBe(true);

  let expected = await getDocFromMaybeToken(athlete);
  expect(expected instanceof mongoose.Document).toBe(true);
  expect(expected.get('access_token')).toBe('my_token');

  expected = await getDocFromMaybeToken(20);
  expect(expected).toBe(null);

  expected = await getDocFromMaybeToken({ hello: 'there' });
  expect(expected).toBe(null);

  /**
    CAUTION!!! opens live connection to database
  **/
  try {
    mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection;
    db.on('close', () => {
      process.exit(0);
    });
    db.once('open', async () => {
      // Save model then find in DB then delete
      await athlete.save({ validateBeforeSave: false });
      const found = await getDocFromMaybeToken('my_token');
      expect(found instanceof mongoose.Document).toBe(true);
      expect(found.get('_id')).toBe(1);
      expect(found.get('access_token')).toBe('my_token');
      await Athlete.deleteOne({ _id: 1 });

      const notFound = await getDocFromMaybeToken('not_a_real_token');
      expect(notFound).toBe(null);

      db.close();
    });
  } catch (err) {
    console.log('Could not connect to database to test fetching by token');
  }
});
