var gulp = require('gulp'),
    rimraf = require('rimraf'),
    gulprimraf = require('gulp-rimraf'),
    pug = require('gulp-pug'),
    sass = require('gulp-sass'),
    sassGlob = require('gulp-sass-glob'),
    pugIncludeGlob = require('pug-include-glob'),
    inlineimage = require('gulp-inline-image'),
    prefix = require('gulp-autoprefixer'),
    plumber = require('gulp-plumber'),
    browserSync = require('browser-sync').create(),
    reload = browserSync.reload(),
    concat = require('gulp-concat'),
    cssfont64 = require('gulp-cssfont64'),
    sourcemaps = require('gulp-sourcemaps'),
    postcss = require('gulp-postcss'),
    assets = require('postcss-assets'),
    notify = require('gulp-notify'),
    webpack = require('webpack-stream'),
    rename = require('gulp-rename'),
    replace = require('gulp-replace');

var uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    csso = require('gulp-csso');

const config = require('./config.js');

// PUG сборка
const compilePug = () => {
    return gulp.src([
        config.dir.source.pug + '*.pug', '!' + config.dir.source.pug + '_*.pug'
    ])
        .pipe(plumber())
        .pipe(pug({
            pretty: '    ',
            plugins: [ pugIncludeGlob({})]
        }))
        .on('error', notify.onError(
        {
            message: "<%= error.message%>",
            title: "PUG Error!"
        }))
        .pipe(gulp.dest(config.dir.target.dist))
        .pipe(browserSync.stream({once: true}));
}

gulp.task('pug', compilePug);

//SCSS сборка
const compileSass = () => {
    return gulp.src([
        config.dir.source.sass + '**/*.scss', '!' + config.dir.source.sass + '**/_*.scss'
    ])
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sassGlob())
        .pipe(sass().on('error', notify.onError(
            {
                message: "<%= error.message %>",
                title: "Sass Error!"
            }))
        )
        .pipe(inlineimage())
        .pipe(prefix('last 3 versions'))
        .pipe(postcss([assets({
            basePath: config.dir.target.dist,
            loadPaths: ['images/']
        })]))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(config.dir.target.styles))
        .pipe(browserSync.stream({match: "**/*.css"}));
}

gulp.task('sass', compileSass);

// CSS сборка
const cssBuild = () => {
    return gulp.src([
        config.dir.target.styles + '**/*', '!' + config.dir.target.styles + '**/*.min.css'
    ])
    .pipe(csso())
    .pipe(rename(function (path) {
        path.extname = '.min.css';
    }))
    .pipe(gulp.dest(config.dir.target.styles + ''))
}

gulp.task('cssBuild', compileSass);

// JS сборка

const webpackBuild = () => {
    return gulp
        .src(config.dir.source.js + 'app.js')
        .pipe(
            webpack(require('./webpack.config.js'))
        )
        .pipe(gulp.dest(config.dir.target.js + ''));
}

gulp.task('webpackBuild', webpackBuild);

const jsBuild = () => {
    return gulp.src([
        config.dir.target.js + '**/*', '!' + config.dir.target.js + '**/*.min.js'
    ])
        .pipe(uglify())
        .pipe(rename(function (path) {
            path.extname = '.min.js';
        }))
        .pipe(gulp.dest(config.dir.target.js))
}

gulp.task('jsBuild', jsBuild);

// SVG сборка
const svgSpriteBuild = () => {
    return gulp.src(config.dir.source.images + 'icons/*.svg')
        .pipe(svgmin({
            js2svg: {
                pretty: true
            }
        }))
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: {xmlMode: true}
        }))
        .pipe(replace('&gt;', '>'))
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: "../sprite.svg",
                    render: {
                        scss: {
                            dest: '../../../sass/_sprite.scss',
                            template: config.dir.source.sass + "templates/_sprite_template.scss"
                        }
                    },
                    example: true
                }
            }
        }))
        .pipe(gulp.dest(config.dir.source.images + 'sprite/'));
}

gulp.task('svgSpriteBuild', svgSpriteBuild);

// Синхронизация катологов
const imageSync = () => {
    return gulp.src(config.dir.source.images + '**/*')
        .pipe(plumber())
        .pipe(gulp.dest(config.dir.target.images + ''))
        .pipe(browserSync.stream({once: true}));
}

gulp.task('imageSync', imageSync);

const fontSync = () => {
    return gulp.src(config.dir.source.fonts + '**/*')
        .pipe(plumber())
        .pipe(gulp.dest(config.dir.target.fonts))
        .pipe(browserSync.stream({once: true}));
}

gulp.task('fontSync', fontSync);

const jsSync = () => {
    return gulp.src([
        config.dir.source.js + '*.js', '!' + config.dir.source.js + 'vendors.js'
    ])
        .pipe(plumber())
        .pipe(gulp.dest(config.dir.target.js))
        .pipe(browserSync.stream({once: true}));
}

gulp.task('jsSync', jsSync);

gulp.task('watch', function (done) {
    gulp.watch(config.dir.source.pug + '**/*.pug', gulp.series('pug'));
    gulp.watch(config.dir.source.sass + '**/*.scss', gulp.series('sass'));
    gulp.watch(config.dir.source.blocks + '**/*.pug', gulp.series('pug'));
    gulp.watch(config.dir.source.blocks + '**/*.scss', gulp.series('sass'));
    gulp.watch(config.dir.source.blocks + '**/*.js', gulp.series('webpackBuild', 'jsSync'));
    gulp.watch(config.dir.source.js + '**/*.js', gulp.series('webpackBuild', 'jsSync'));
    gulp.watch(config.dir.source.images + '**/*', gulp.series('imageSync'));
    gulp.watch(config.dir.source.fonts + '**/*', gulp.series('fontsSync'/*, 'fontsConvert'*/));

    done();
});

gulp.task('browser-sync', function () {
    return browserSync.init(plugins.browserSync.options);
})

gulp.task('bs-reload', function (cb) {
    browserSync.reload();
})
