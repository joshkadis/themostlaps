module.exports = ({ file, options }) => ({
  plugins: {
    'postcss-import': { root: file.dirname },
    'postcss-cssnext': options,
  }
});
