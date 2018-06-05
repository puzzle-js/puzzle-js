const gulp = require('gulp');

gulp.task('copyPublic', () => {
    gulp
        .src(['src/public/*'])
        .pipe(gulp.dest('dist/public'))
});

gulp.task('build', ['copyPublic']);
