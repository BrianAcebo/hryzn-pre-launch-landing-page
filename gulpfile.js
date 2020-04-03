// Gulp imports
var gulp = require('gulp');
var minifyCSS = require('gulp-minify-css');
var autoprefixer = require('gulp-autoprefixer');
var gp_concat = require('gulp-concat');
var gp_rename = require('gulp-rename');
var gp_uglify = require('gulp-uglify');
var del = require('del');
var path = require('path');

var AUTOPREFIXER_BROWSERS = [
   'ie >= 10',
   'ie_mob >= 10',
   'ff >= 30',
   'chrome >= 34',
   'safari >= 7',
   'opera >= 23',
   'ios >= 7',
   'android >= 4.4',
   'bb >= 10'
];

// Clean output directory
gulp.task('clean', function() {
   return del(['./public/dist/']);
});

// Gulp Task for Optimizing CSS Loads
gulp.task('css-main', function() {
   return gulp.src('./public/css/site/*.css')
   .pipe(autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
   .pipe(minifyCSS())
   .pipe(gp_concat('style.min.css'))
   .pipe(gulp.dest('./public/dist/css/'))
});


/***** Gulp task was causing errors *****/
// Gulp Task for Optimizing JS Loads
gulp.task('js-main', function() {
   return gulp.src('./public/js/main.js')
   .pipe(gp_concat('main.min.js'))
   .pipe(gulp.dest('./public/dist/js/'))
   .pipe(gp_rename('main.min.js'))
   .pipe(gp_uglify())
   .pipe(gulp.dest('./public/dist/js/'))
});

// Gulp task to minify all files
gulp.task('prod', function() {
   runSequence(
     'clean',
     'css-main'
   );
});

gulp.task('prod', gulp.series(gulp.parallel(['clean', 'css-main']), function() {}))
