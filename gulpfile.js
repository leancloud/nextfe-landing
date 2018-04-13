const gulp = require('gulp');
const connect = require('gulp-connect');
const scss = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const del = require('gulp-clean');
const cleanCSS = require('gulp-clean-css');
const eslint = require('gulp-eslint');
const babel = require('gulp-babel');
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');
const path = require('path');
const fs = require('fs');


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

gulp.task('html', () => gulp.src(config.html)
  .pipe(gulp.dest(build)));

gulp.task('copyfile', () => gulp.src(config.copyfile)
  .pipe(gulp.dest(build)));


gulp.task('gulpscss', () => gulp.src(config.scss.src)
  .pipe(scss().on('error', scss.logError))
  .pipe(autoprefixer(config.scss.autoprefixer))
  .pipe(gulp.dest(`${build}css`))
  .pipe(rename({ suffix: '.min' }))
  .pipe(cleanCSS(config.scss.cleanCSS))
  .pipe(gulp.dest(`${build}css`)));


gulp.task('clean', () => {
  const stat = fs.existsSync(path.join(__dirname, build));
  if (stat) {
    return gulp.src(build, { read: false })
      .pipe(del());
  }
  return Promise.resolve();
});
gulp.task('babel', () => gulp.src(config.js)
  .pipe(plumber())
  .pipe(babel())
  .pipe(gulp.dest(`${build}js`))
  .pipe(rename({ suffix: '.min' }))
  .pipe(gulp.dest(`${build}js`)));

gulp.task('jsLint', () => gulp.src(config.js)
  .pipe(plumber())
  .pipe(eslint())
  .pipe(eslint.format()));

gulp.task('babelJs', gulp.series('jsLint', 'babel'));

gulp.task('server', () => connect.server(config.server));
gulp.task('watch', () => {
  if (config && config.watch) {
    config.watch.forEach((v) => {
      gulp.watch(v.src, gulp.task(v.task));
    });
  }
});

gulp.task('watch-server', gulp.parallel('server', 'watch'));

gulp.task('build', gulp.parallel('html', 'babelJs', 'gulpscss', 'copyfile'));

gulp.task('default', gulp.series('clean', 'build', 'watch-server'));


// const  spritesmith = require('gulp.spritesmith');
// function sprite() {
//     return gulp.src(['./cnValentine/images/icons/hd.png', './cnValentine/images/03_10.png'])
//         .pipe(spritesmith({
//             imgName: 'icons.png', // 生成的图片
//             cssName: 'icons.scss', // 生成的sass文件
//             cssFormat: 'scss',
//             algorithm: 'binary-tree', // 图标的排序方式
//             padding: 8,
//             cssTemplate: './cnValentine/handlebarsInheritance.scss.handlebars',
//             cssVarMap: function(sprite) {
//                 sprite.name = 'icon-' + sprite.name;
//             }
//         }))
//         .pipe(gulp.dest('./test'));

// }
