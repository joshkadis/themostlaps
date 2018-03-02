const withCSS = require('@zeit/next-css');
module.exports = withCSS({
  cssModules: true,
  cssLoaderOptions: {
    modules: true,
    localIdentName: '[name]__[local]--[hash:base64:5]',
    importLoaders: 2,
  },
});
