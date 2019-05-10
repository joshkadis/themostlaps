require('dotenv').config()
const webpack = require('webpack')
const withCSS = require('@zeit/next-css');

module.exports = withCSS({
  cssModules: true,
  cssLoaderOptions: {
    modules: true,
    localIdentName: '[name]__[local]--[hash:base64:5]',
    importLoaders: 2,
  },
  webpack: (config) => {
    const define = new webpack.EnvironmentPlugin([
      'APP_DOMAIN',
      'PORT',
      'CLIENT_ID',
    ]);
    config.plugins.push(define);
    return config;
  },
});
