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

gulp.task('build', ['copyPublic']);
