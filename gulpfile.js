const gulp = require("gulp"),
    path = require('path'),
    less = require('gulp-less'),
    babel = require('gulp-babel'),
    uglify = require('gulp-uglify'),
    rename = require("gulp-rename"),
    sourcemaps = require('gulp-sourcemaps');

// Generate Widget style
gulp.task('less', function () {
    return gulp.src('./res/*.less')
        .pipe(less())
        .pipe(gulp.dest('./dist'));
});

// Uglify Widget source code
gulp.task("uglifyWidget", () => {
    return gulp.src(['src/woleet-widget.js'])
        .pipe(sourcemaps.init())
        .pipe(babel({presets: ['env']}))
        .pipe(gulp.dest("./dist/"))
        .pipe(uglify())
        .pipe(rename("woleet-widget.min.js"))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest("./dist/"))
});

gulp.task('default', [
    'uglifyWidget',
    'less'
]);