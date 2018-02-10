module.exports = {
  rankingTypes: [
    'allTime',
    'year',
    'month',
    'single',
  ],
  rankingTypeFilters: {
    allTime: { $gte: 999 },
  },
};
