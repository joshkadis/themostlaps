/**
 * Add an async iterator to an array
 *
 * @param {Array} source
 * @param {Function} iterator Async function used
 * @return {Array}
 */
function makeArrayAsyncIterable(source, iterator) {
  // eslint-disable-next-line no-param-reassign
  source[Symbol.asyncIterator] = () => ({
    idx: 0,
    // eslint-disable-next-line func-names
    async next() {
      if (this.idx < source.length) {
        const result = await iterator(source[this.idx]);
        this.idx += 1;
        return Promise.resolve({ value: result, done: false });
      }
      return Promise.resolve({ done: true });
    },
  });

  return source;
}

module.exports = {
  makeArrayAsyncIterable,
};
