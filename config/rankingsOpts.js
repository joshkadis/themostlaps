const { getMonthName } = require('../utils/dateTimeUtils');

const startYear = 2010;

const primaryOptions = [
  { value: 'cold2019', label: '❄️ Cold Laps ❄️' },
  { value: 'allTime', label: 'All Time' },
  { value: 'single', label: 'Single Ride' },
  { value: 'giro2018', label: '2018 Giro di Laps' },
];

const current = new Date();

for (let yr = current.getFullYear(); yr >= startYear; yr -= 1) {
  primaryOptions.push({
    value: `timePeriod.${yr}`,
    label: yr.toString(),
  });
}

const secondaryOptions = [{
  value: null,
  label: 'clear month',
}];
for (let mo = 1; mo <= 12; mo += 1) {
  secondaryOptions.push({
    value: mo.toString(),
    label: getMonthName(mo),
  });
}

module.exports = {
  primaryOptions,
  secondaryOptions,
  specialOptions: ['giro2018', 'cold2019'],
  startYear,
};
