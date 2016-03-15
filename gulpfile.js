'use strict';
const path = require('path');
const gulp = require('gulp');
const del = require('del');
const merge = require('merge2');
const Builder = require('systemjs-builder');
const ts = require('gulp-typescript');

const ANGULAR2_POLYFILL_BUNDLE_CONFIG = [
	'angular2-polyfill/core',
	'angular2-polyfill/http',
	'angular2-polyfill/router',
	'angular2-polyfill/platform/upgrade'
];

const NG2_POLYFILL_BUNDLE_CONTENT = ANGULAR2_POLYFILL_BUNDLE_CONFIG.join(' + ');

const bundleConfig = {
	paths: {
		'dot-prop': path.join(__dirname, '/node_modules/dot-prop/index.js'),
		'is-obj': path.join(__dirname, '/node_modules/is-obj/index.js'),
		'camelcase': path.join(__dirname, '/node_modules/camelcase/index.js'),
		'decamelize': path.join(__dirname, '/node_modules/decamelize/index.js'),
		'*': '*.js'
	}
};

function bundle(buildConfig, moduleName, outputFile, outputConfig) {
	const builder = new Builder();
	builder.config(buildConfig);
	return builder.bundle(moduleName, outputFile, outputConfig);
}

gulp.task('bundle', ['cp'], () => {
	return bundle(bundleConfig, NG2_POLYFILL_BUNDLE_CONTENT, './bundles/angular2-polyfill.js', {sourceMaps: true})
		.then(() => del('angular2-polyfill'));
});

gulp.task('cp', () => {
	const streams = [];
	streams.push(gulp.src('*.js').pipe(gulp.dest('angular2-polyfill')));
	streams.push(gulp.src('**/*.js', {cwd: 'platform'}).pipe(gulp.dest('angular2-polyfill/platform')));
	streams.push(gulp.src('**/*.js', {cwd: 'src'}).pipe(gulp.dest('angular2-polyfill/src')));

	return merge(streams);
});

gulp.task('declarations', () => {
	const project = ts.createProject('tsconfig.json', {outFile: 'angular2-polyfill.js'});
	const tsResult = project.src()
		.pipe(ts(project));
	return tsResult.dts.pipe(gulp.dest('bundles'))
});
