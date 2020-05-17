const { setDimensions } = require('./analytics');

test('setDimensions', () => {
  expect(setDimensions({
    'User Has Connected': 'yes',
    dimension2: 'homepage',
  })).toEqual({
    dimension1: 'yes',
    dimension2: 'homepage',
  });

  expect(setDimensions({
    dimension1: 'yes',
    dimension2: 'homepage',
  })).toEqual({
    dimension1: 'yes',
    dimension2: 'homepage',
  });

  expect(setDimensions({
    'User Has Connected': 'yes',
    'Signup Starting Point': 12,
  })).toEqual({
    dimension1: 'yes',
    dimension2: '12',
  });

  expect(setDimensions({
    'User Has Connected': 'yes',
    'Signup Starting Point': 'nav',
    'Unknown Dimension Name': 'howdy',
  })).toEqual({
    dimension1: 'yes',
    dimension2: 'nav',
  });
});
