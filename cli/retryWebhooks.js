const path = require('path');
const glob = require('glob');

// YYYY-MM-DD to integer
const dateStringToInt = (date) => parseInt(date.replace(/-/g, ''), 10);

// integer to YYYY-MM-DD
const intToDateString = (int) => {
  let digits = [...int.toString()];
  digits.splice(4, 0, '-');
  digits.splice(7, 0, '-')
  return digits.join('');
}

async function retryWebhooks(startdate, dryrun) {
  const logFilesPath = path.resolve(__dirname, '../slack-logs');
  const logFiles = glob.sync(logFilesPath + '/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9].json')
    .map((filename) => path.basename(filename, '.json'))
    .map(dateStringToInt)
    .filter((logDate) => (!isNaN(logDate) && logDate >= startdate))
    .map((int) => `${logFilesPath}/${intToDateString(int)}.json`);

  process.exit(0);
}

module.exports = retryWebhooks;
