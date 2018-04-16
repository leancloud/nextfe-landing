const gulp = require('gulp');
const connect = require('gulp-connect');
const scss = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const del = require('gulp-clean');
const cleanCSS = require('gulp-clean-css');
const htmlmin = require('gulp-htmlmin');
const uglify = require('gulp-uglify');
const eslint = require('gulp-eslint');
const babel = require('gulp-babel');
// const rename = require('gulp-rename');
const plumber = require('gulp-plumber');
const gulpif = require('gulp-if');
const path = require('path');
const fs = require('fs');
const lazypipe = require('lazypipe');
const rev = require('gulp-rev');
const revReplace = require('gulp-rev-replace');

const env = process.env.NODE_ENV || 'prod';
const ispord = env === 'prod';
const build = './build/';
const config = {
  html: './src/html/**/**.html',
  scss: {
    src: './src/scss/index.scss',
    autoprefixer: {
      comPatibility: ['last 2 versions', 'ie >= 9', 'Android >= 2.3'],
      remove: false
    },
    cleanCSS: {
      advanced: true,
      compatibility: '*',
      keepBreaks: true
    }
  },
  js: './src/js/**.js',
  copyfile: './src/*assert/**',
  server: {
    root: build,
    port: 8090,
    livereload: true
  },
  watch: [
    {
      src: ['./src/html/**/**.html'],
      task: 'html'
    },
    {
      src: ['./src/js/**.js'],
      task: 'babelJs'
    },
    {
      src: ['./src/scss/*.scss'],
      task: 'gulpscss'
    }
  ]
};

gulp.task('html', () => {
  const manifest = gulp.src(`${build}rev/**/rev-manifest.json`);
  const prodHtml = lazypipe()
    .pipe(htmlmin, {
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      minifyJS: true,
      minifyCSS: true
    })
    .pipe(revReplace, { manifest });

    // .pipe(gulpif(ispord, prodHtml()))
  return gulp.src(config.html)
    .pipe(gulpif(ispord, prodHtml()))
    // .pipe(htmlmin({
    //   removeComments: true,
    //   collapseWhitespace: true,
    //   collapseBooleanAttributes: true,
    //   removeEmptyAttributes: true,
    //   removeScriptTypeAttributes: true,
    //   removeStyleLinkTypeAttributes: true,
    //   minifyJS: true,
    //   minifyCSS: true
    // }))
    // .pipe(revReplace({ manifest }))
    .pipe(gulp.dest(build));
});

gulp.task('gulpscss', (done) => {
  const scssProd = lazypipe()
    .pipe(cleanCSS, config.scss.cleanCSS)
    .pipe(rev)
    .pipe(gulp.dest, `${build}css`)
    .pipe(rev.manifest)
    .pipe(gulp.dest, `${build}rev/css`);

  gulp.src(config.scss.src)
    .pipe(plumber())
    .pipe(scss())
    .pipe(autoprefixer(config.scss.autoprefixer))
    .pipe(gulp.dest(`${build}css`))
    .pipe(gulpif(ispord, scssProd()));
  done();
});

gulp.task('babelJs', (done) => {
  const prodJS = lazypipe()
    .pipe(uglify)
    .pipe(rev)
    .pipe(gulp.dest, `${build}js`)
    .pipe(rev.manifest)
    .pipe(gulp.dest, `${build}rev/js`);

  gulp.src(config.js)
    .pipe(plumber())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(babel())
    .pipe(gulp.dest(`${build}js`))
    .pipe(gulpif(ispord, prodJS()));
  done();
});

// gulp.task('revreplace', () => {
//   const manifest = gulp.src(`${build}rev/**/rev-manifest.json`);
//   return gulp.src(config.html)
//     .pipe(revReplace({ manifest }))
//     .pipe(gulp.dest(opt.distFolder));
// });

gulp.task('copyfile', () => gulp.src(config.copyfile)
  .pipe(gulp.dest(build)));

gulp.task('clean', (done) => {
  const stat = fs.existsSync(path.join(__dirname, build));
  if (stat) {
    return gulp.src(build, { read: false })
      .pipe(del());
  }
  done();
});


gulp.task('watch-server', (done) => {
  if (config && config.watch) {
    config.watch.forEach((v) => {
      gulp.watch(v.src, gulp.task(v.task));
    });
  }
  connect.server(config.server);
  done();
});

gulp.task(
  'build',
  gulp.series('clean', gulp.parallel('babelJs', 'gulpscss', 'copyfile'), 'html')
);

gulp.task('default', gulp.series('clean', 'build', 'watch-server'));
