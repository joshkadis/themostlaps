const fs = require('fs');
const path = require('path');
const glob = require('glob');
const refreshAthleteFromActivity = require('../utils/refreshAthlete/refreshAthleteFromActivity');

// YYYY-MM-DD to integer
const dateStringToInt = (date) => parseInt(date.replace(/-/g, ''), 10);

// integer to YYYY-MM-DD
const intToDateString = (int) => {
  const digits = [...int.toString()];
  digits.splice(4, 0, '-');
  digits.splice(7, 0, '-');
  return digits.join('');
};

function getActivityDataToRetry({ attachments }) {
  let shouldRetry = true;
  try {
    shouldRetry = attachments[0].pretext === 'Error code 110'
      && attachments[0].fields[1].title === 'Details';
  } catch (error) {
    return false;
  }
  if (!shouldRetry) {
    return false;
  }

  try {
    const activity = JSON.parse(attachments[0].fields[1].value);
    if (activity.aspect_type !== 'create') {
      return false;
    }

    return {
      owner_id: activity.owner_id,
      object_id: activity.object_id,
    };
  } catch (error) {
    return false;
  }
}

function getActivitiesFromFile(filename) {
  let logData = [];
  try {
    logData = JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch (error) {
    console.log(`Error parsing ${filename}`);
    return null;
  }

  if (!logData || !logData.length) {
    console.log(`${filename} contained no data`);
    return null;
  }

  return logData.reduce((acc, message) => {
    const activityData = getActivityDataToRetry(message);
    return activityData ? [...acc, activityData] : acc;
  }, []);
}


async function retryWebhooks(startdate, dryrun) {
  const logFilesPath = path.resolve(__dirname, '../slack-logs');
  const logFiles = glob.sync(`${logFilesPath}/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9].json`)
    .map((filename) => path.basename(filename, '.json'))
    .map(dateStringToInt)
    .filter((logDate) => (!Number.isNaN(logDate) && logDate >= startdate))
    .map(intToDateString);

  console.log(`Retrying ${logFiles.length} log files`);

  const activitiesToRetry = logFiles.reduce((acc, date) => {
    const filename = `${logFilesPath}/${date}.json`;
    const fileActivities = getActivitiesFromFile(filename);
    console.log(`Found ${fileActivities.length} on ${date}`);
    return fileActivities
      ? acc.concat(fileActivities)
      : acc;
  }, []);

  // @todo Async iterator
  for (let idx = 0; idx < activitiesToRetry.length; idx += 1) {
    const { owner_id, object_id } = activitiesToRetry[idx];
    try {
      // eslint-disable-next-line
      await refreshAthleteFromActivity(owner_id, object_id, !dryrun);
    } catch (err) {
      // log ouput provided by refreshAthleteFromActivity
    }
  }

  process.exit(0);
}

module.exports = retryWebhooks;
