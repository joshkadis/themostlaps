module.exports = ({ file, options }) => {
  console.log(file, options);
  return {
    plugins: {
      'postcss-import': { root: file.dirname },
      'postcss-cssnext': options,
    }
  };
};
