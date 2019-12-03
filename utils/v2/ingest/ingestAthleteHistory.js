const getNumber = async (number) => number;

var asyncIterable = {
  [Symbol.asyncIterator]() {
    return {
      idx: 0,
      next: async function() {
        if (this.idx < 3) {
          const theIdx = await getNumber(this.idx);
          this.idx++;
          return Promise.resolve({ value: theIdx, done: false });
        }

        return Promise.resolve({ done: true });
      }
    };
  }
};

module.exports = async function() {
   for await (let num of asyncIterable) {
     console.log(num);
   }
};
