const gulp = require("gulp"),
  less = require('gulp-less'),
  babel = require('gulp-babel'),
  minify = require('gulp-minify'),
  sourcemaps = require('gulp-sourcemaps');

// Generate Widget style
gulp.task('less', function () {
  return gulp.src('./res/*.less')
    .pipe(less())
    .pipe(gulp.dest('./dist'));
});

// Uglify Widget source code
gulp.task("widget", () => {
  return gulp.src(['src/woleet-widget.js'])
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(gulp.dest("./dist/"))
    .pipe(minify({ ext: { min: '.min.js' } }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest("./dist/"))
});

gulp.task('default', gulp.parallel('widget', 'less'));
