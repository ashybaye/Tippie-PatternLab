// Special thanks to oscar-g (https://github.com/oscar-g) for starting this at https://github.com/oscar-g/patternlab-node/tree/dev-gulp

var 
    config = require('./config.json'),
    pkg = require('./package.json'),
    gulp = require('gulp'),
    path = require('path'),
    eol = require('os').EOL,
    del = require('del'),
    strip_banner = require('gulp-strip-banner'),
    header = require('gulp-header'),
    nodeunit = require('gulp-nodeunit'),
    sass = require('gulp-sass'),
    cssmin = require('gulp-cssmin'),
    gulpif = require('gulp-if'),
    rename = require('gulp-rename'),
    browserSync = require('browser-sync').create();

require('gulp-load')(gulp);
var banner = [ '/** ',
  ' * <%= pkg.name %> - v<%= pkg.version %> - <%= today %>',
  ' * ',
  ' * <%= pkg.author %>, and the web community.',
  ' * Licensed under the <%= pkg.license %> license.',
  ' * ',
  ' * Many thanks to Brad Frost and Dave Olsen for inspiration, encouragement, and advice.',
  ' * ', ' **/'].join(eol);

/*-------------------------------------------------------------------
    Configuration
-------------------------------------------------------------------*/

// Production Handling
// Description: Use 'production' variable with 'gulpif'
// to minify and optimize assets for production
var production;

function paths () {
  return require('./config.json').paths;
}

//load patternlab-node tasks
gulp.loadTasks(__dirname+'/builder/patternlab_gulp.js');

//clean patterns dir
gulp.task('clean', function(cb){
  del.sync([path.resolve(paths().public.patterns, '*')], {force: true});
  cb();
});

//build the banner
gulp.task('banner', function(){
  return gulp.src([
    './builder/patternlab.js',
    './builder/object_factory.js',
    './builder/lineage_hunter.js',
    './builder/media_hunter.js',
    './builder/patternlab_grunt.js',
    './builder/patternlab_gulp.js',
    './builder/parameter_hunter.js',
    './builder/pattern_exporter.js',
    './builder/pattern_assembler.js',
    './builder/pseudopattern_hunter.js',
    './builder/list_item_hunter.js',
    './builder/style_modifier_hunter.js'
  ])
    .pipe(strip_banner())
    .pipe(header( banner, {
      pkg : pkg,
      today : new Date().getFullYear() }
    ))
    .pipe(gulp.dest('./builder'));
});

// Task: Handle Sass and CSS
gulp.task('sass', function () {
  return gulp.src(config.paths.source.scss.files)
    .pipe(sass())
    .pipe(gulpif(production, cssmin()))
    .pipe(gulpif(production, rename({
      suffix: '.min'
    })))
    .pipe(gulp.dest(
      path.resolve(config.paths.source.scss.dest)
    ))
    .pipe(browserSync.reload({stream:true}));
});

// COPY TASKS

// JS copy
gulp.task('cp:js', function(){
  return gulp.src('**/*.js', {cwd: path.resolve(paths().source.js)} )
    .pipe(gulp.dest(path.resolve(paths().public.js)));
});

// Images copy
gulp.task('cp:img', function(){
  return gulp.src(
    [ '**/*.gif', '**/*.png', '**/*.jpg', '**/*.jpeg'  ],
    {cwd: path.resolve(paths().source.images)} )
    .pipe(gulp.dest(path.resolve(paths().public.images)));
});

// Fonts copy
gulp.task('cp:font', function(){
  return gulp.src('*', {cwd: path.resolve(paths().source.fonts)})
    .pipe(gulp.dest(path.resolve(paths().public.fonts)));
});

// Data copy
gulp.task('cp:data', function(){
  return gulp.src('annotations.js', {cwd: path.resolve(paths().source.data)})
    .pipe(gulp.dest(path.resolve(paths().public.data)));
});

// CSS Copy
gulp.task('cp:css', function(){
  return gulp.src(path.resolve(paths().source.css, 'style.css'))
    .pipe(gulp.dest(path.resolve(paths().public.css)))
    .pipe(browserSync.stream());
});

// Styleguide Copy
gulp.task('cp:styleguide', function(){
  return gulp.src(
      ['**/*'],
      {cwd: path.resolve(paths().source.styleguide)})
      .pipe(gulp.dest(path.resolve(paths().public.styleguide)))
      .pipe(browserSync.stream());
});

// server and watch tasks
gulp.task('connect', ['lab'], function () {
  browserSync.init({
    server: {
      baseDir: path.resolve(paths().public.root)
    },
    snippetOptions: {
      // Ignore all HTML files within the templates folder
      blacklist: ['/index.html', '/']
    },
    notify: {
      styles: [
        'display: none',
        'padding: 15px',
        'font-family: sans-serif',
        'position: fixed',
        'font-size: 1em',
        'z-index: 9999',
        'bottom: 0px',
        'right: 0px',
        'border-top-left-radius: 5px',
        'background-color: #1B2032',
        'opacity: 0.4',
        'margin: 0',
        'color: white',
        'text-align: center'
      ]
    }
  });
  gulp.watch(path.resolve(paths().source.css, '**/*.css'), ['cp:css']);

  gulp.watch(path.resolve(paths().source.styleguide, '**/*.*'), ['cp:styleguide']);

 // Watch Sass
  gulp.watch(
    path.resolve(paths().source.scss.base, '**/*.scss'),
    ['sass']
  );

  gulp.watch(
    [
      path.resolve(paths().source.patterns, '**/*.mustache'),
      path.resolve(paths().source.patterns, '**/*.json'),      
      path.resolve(paths().source.data, '*.json'),
      path.resolve(paths().source.fonts + '/*'),
      path.resolve(paths().source.images + '/*'),
      path.resolve(paths().source.data + '*.json')
    ],
    ['lab-pipe'],
    function () { browserSync.reload(); }
  );

});

//unit test
gulp.task('nodeunit', function(){
  return gulp.src('./test/**/*_tests.js')
    .pipe(nodeunit());
});


gulp.task('lab-pipe', ['lab'], function(cb){
  cb();
  browserSync.reload();
});

gulp.task('default', ['sass','lab']);

gulp.task('assets', ['cp:js', 'cp:img', 'cp:font', 'cp:data', 'cp:css', 'cp:styleguide' ]);
gulp.task('prelab', ['clean', 'assets']);
gulp.task('lab', ['prelab', 'patternlab'], function(cb){cb();});
gulp.task('patterns', ['patternlab:only_patterns']);
gulp.task('serve', ['lab', 'connect']);
gulp.task('travis', ['lab', 'nodeunit']);

gulp.task('version', ['patternlab:version']);
gulp.task('help', ['patternlab:help']);
