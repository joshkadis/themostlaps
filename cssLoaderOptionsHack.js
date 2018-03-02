#!/usr/bin/env node
/**
 * Simulate this PR https://github.com/zeit/next-plugins/pull/65/files
 * until it gets merged and released
 */
const fs = require('fs');

const path = require('path');

const nextCssPath = 'node_modules/@zeit/next-css';

function doHack() {
  const indexJs = fs.readFileSync(
    path.join(__dirname, nextCssPath, '/index.js'),
    { encoding: 'utf8' }
  );

  if (indexJs.indexOf('cssLoaderOptions') !== -1) {
    console.log('cssLoaderOptions exists in index.js already');
    process.exit(0);
  }

  console.log('replacing file');
  fs.writeFileSync(
    path.join(__dirname, nextCssPath, '/index.js'),
    indexJs.replace(/cssModules/g, 'cssModules, cssLoaderOptions')
  );

  process.exit(0);
}

fs.readFile(
  path.join(__dirname, nextCssPath, '/package.json'),
  { encoding: 'utf8' },
  (err, data) => {
    if (err) {
      console.log(err);
      process.exit(0);
    }
    try {
      const nextCssPackage = JSON.parse(data);
      if (nextCssPackage.version === '0.1.2') {
        doHack();
      }
    } catch (err) {
      console.log(err);
      process.exit(0);
    }
  }
)