process.env.MAILGUN_API_KEY = 'just testing';
const { getMonthlyUpdateContent } = require('./index');
const { getMonthKey } = require('../dateTimeUtils');

test('getMonthlyUpdateContent()', async () => {
  // Parse test file
  let fixedDate = new Date('2017-06-02T08:41:36Z');
  expect(await getMonthlyUpdateContent(fixedDate)).toEqual({
    filename: 'update_201706.md',
    raw: `This is just for testing.

### Hello world.`,
    markdown: `<p>This is just for testing.</p>
<h3>Hello world.</h3>
`,
  });

  // Look for nonexistent file
  fixedDate = new Date('2014-02-02T08:41:36Z');
  expect(await getMonthlyUpdateContent(fixedDate)).toEqual({
    filename: 'update_201402.md',
    raw: '',
    markdown: '',
  });
});