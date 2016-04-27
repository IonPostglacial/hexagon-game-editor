const gulp = require('gulp');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const http = require('http');
const st = require('st')
const livereload = require('gulp-livereload');
const es = require('event-stream');
const path = require('path');

gulp.task('js', function() {
    return browserify({
      debug: true,
      entries: ['js/main.js'],
    })
    .transform('babelify', { presets: ['es2015', 'react'] })
    .bundle()
    .on('error', function (err) { console.error(err); })
    .pipe(source(path.basename('js/main.js')))
    //.pipe(sourcemaps.init({ loadMaps: true }))
    //.pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['js'], function (done) {
  http.createServer(
    st({ index: 'hex.html', cache: false, path: './' })
	).listen(8080, done);
	livereload.listen();
	gulp.watch('src/*', ['js']);
});
