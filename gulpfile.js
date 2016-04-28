const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const http = require('http');
const st = require('st')
const livereload = require('gulp-livereload');

gulp.task('js', function() {
    return browserify({
      debug: true,
      entries: ['js/main.js'],
    })
    .bundle()
    .on('error', function (err) { console.error(err); })
    .pipe(source('main.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['js'], function (done) {
  http.createServer(
    st({ index: 'hex.html', cache: false, path: './' })
	).listen(8080, done);
	livereload.listen();
	gulp.watch('js/*', ['js']);
});
