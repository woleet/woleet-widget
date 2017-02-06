const gulp = require("gulp"),
    path = require('path'),
    less = require('gulp-less'),
    babel = require('gulp-babel'),
    uglify = require('gulp-uglify'),
    rename = require("gulp-rename"),
    sourcemaps = require('gulp-sourcemaps');

//
gulp.task('less', function () {
    return gulp.src('./res/*.less')
        //.pipe(sourcemaps.init())
        .pipe(less())
        //.pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./dist'));
});

// Uglify widget
gulp.task("uglifyWidget", () => {
    return gulp.src(['src/woleet-widget.js'])
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['latest']
        }))
        .pipe(gulp.dest("./dist/"))
        .pipe(uglify())
        .pipe(rename("widget.min.js"))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest("./dist/"))
});


gulp.task('default', [
    'uglifyWidget',
    'less'
]);