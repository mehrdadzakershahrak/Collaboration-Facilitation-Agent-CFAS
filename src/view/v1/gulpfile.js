var gulp          =  require('gulp');
var $             =  require('gulp-load-plugins')();
var autoprefixer  =  require('autoprefixer');
var concat = require('gulp-concat');
var babel = require('gulp-babel');
var sass = require('gulp-sass');
var browserSync   = require('browser-sync').create();

var sassPaths = [
  'node_modules/foundation-sites/scss', 
  'node_modules/motion-ui/src'
];

const jssync = gulp.task('js', function() {
  return gulp.src('view_controller/*.js')
    .pipe(concat('app.js'))
    .pipe(babel({
      presets: ['@babel/preset-env', '@babel/preset-react']
    }))
    .pipe(gulp.dest('./app/'));
});

const stylesync = gulp.task('style', function () {
  return gulp.src(['style/*.scss'])
    .pipe(concat('app.css'))
    .pipe($.sass({
      includePaths: sassPaths,
      outputStyle: 'compressed'
    }).on('error', $.sass.logError))
    .pipe($.postcss([
      autoprefixer({ browsers: ['last 2 versions', 'ie >= 9'] })
    ]))
    .pipe(gulp.dest('./app'));
});