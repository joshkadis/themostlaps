const { getMonthName } = require('../utils/dateTimeUtils');

const startYear = 2010;

const primaryOptions = [
  { value: 'allTime', label: 'All Time' },
  { value: 'single', label: 'Single Ride' },
];

const current = new Date();

for (let yr = current.getFullYear(); yr >= startYear; yr--) {
  primaryOptions.push({
    value: `timePeriod.${yr}`,
    label: yr.toString(),
  });
}

secondaryOptions = [{
  value: null,
  label: 'none',
}];
for (let mo = 1; mo <= 12; mo++) {
  secondaryOptions.push({
    value: mo.toString(),
    label: getMonthName(mo),
  });
}

module.exports = {
  primaryOptions,
  secondaryOptions,
  startYear,
};
