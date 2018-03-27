const {
  encrypt,
  decrypt,
} = require('./encryption');

test('encryption', () => {
  const encrypted = encrypt('hello world', 'test key');
  expect(decrypt(encrypted, 'test key')).toBe('hello world');
});
