const gulp = require('gulp');
const replace = require('gulp-replace');
const package = require('./package');
const {parallel, series, src} = require('gulp');

const copyPublic = () => {
  return src(['src/public/*'])
    .pipe(replace(`PACKAGE_VERSION = '';`, `PACKAGE_VERSION = '${package.version}';`))
    .pipe(replace(`const DEPENDENCIES = {};`, `const DEPENDENCIES = ${JSON.stringify(package.dependencies)};`))
    .pipe(gulp.dest('dist/public'))
};

const replacePuzzleDebugLib = () => {
  return src(['dist/lib/puzzle_debug.min.js'])
    .pipe(replace(`PACKAGE_VERSION=""`, `PACKAGE_VERSION="${package.version}"`))
    .pipe(replace(`DEPENDENCIES={}`, `DEPENDENCIES=${JSON.stringify(package.dependencies)}`))
    .pipe(replace(`LOGO=""`, `LOGO="${package.logo}"`))
    .pipe(gulp.dest('dist/lib'))
};


const replacePuzzleProdLib = () => {
  return src(['dist/lib/puzzle.min.js'])
    .pipe(replace(`PACKAGE_VERSION=""`, `PACKAGE_VERSION="${package.version}"`))
    .pipe(gulp.dest('dist/lib'))
};


module.exports = {
  copyPublic,
  replacePuzzleDebugLib,
  replacePuzzleProdLib,
  prepareLib: parallel(replacePuzzleDebugLib, replacePuzzleProdLib),
  build: series(copyPublic)
};
