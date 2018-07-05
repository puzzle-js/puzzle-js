const gulp = require('gulp');
const replace = require('gulp-replace');
const package = require('./package');

gulp.task('copyPublic', () => {
  gulp
    .src(['src/public/*'])
    .pipe(replace(`PACKAGE_VERSION = '';`, `PACKAGE_VERSION = '${package.version}';`))
    .pipe(replace(`const DEPENDENCIES = {};`, `const DEPENDENCIES = ${JSON.stringify(package.dependencies)};`))
    .pipe(gulp.dest('dist/public'))
});

gulp.task('replacePuzzleDebugLib', () => {
  gulp
    .src(['dist/lib/puzzle_debug.min.js'])
    .pipe(replace(`PACKAGE_VERSION=""`, `PACKAGE_VERSION="${package.version}"`))
    .pipe(replace(`DEPENDENCIES={}`, `DEPENDENCIES=${JSON.stringify(package.dependencies)}`))
    .pipe(replace(`LOGO=""`, `LOGO="${package.logo}"`))
    .pipe(gulp.dest('dist/lib/puzzle_debug.min.js'))
});

gulp.task('replacePuzzleProdLib', () => {
  gulp
    .src(['dist/lib/puzzle.min.js'])
    .pipe(replace(`PACKAGE_VERSION=""`, `PACKAGE_VERSION="${package.version}"`))
    .pipe(gulp.dest('dist/lib/puzzle.min.js'))
});

gulp.task('prepareLib', ['replacePuzzleDebugLib', 'replacePuzzleProdLib']);

gulp.task('build', ['copyPublic']);
