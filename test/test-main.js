var allTestFiles = [];
var TEST_REGEXP = /\.spec\.js$/i;

var pathToModule = function(path) {
    return path.replace(/^\/base\//, '').replace(/\.js$/, '');
};

Object.keys(window.__karma__.files).forEach(function(file) {
    if (TEST_REGEXP.test(file)) {
        // Normalize paths to RequireJS module names.
        allTestFiles.push(pathToModule(file));
    }
});

require.config({
    '*': {
        'css': 'css' // or whatever the path to require-css is
    },
    // Karma serves files under /base, which is the basePath from your config file
    baseUrl: '/base',

    // dynamically load all test files
    deps: allTestFiles,

    // we have to kickoff jasmine, as it is asynchronous
    callback: window.__karma__.start,

    paths: {
        jquery: 'lib/jquery/jquery',
        angular: 'lib/angular/angular',
        ngRoute: 'lib/angular-route/angular-route',
        css: 'lib/require-css/css',
    },
    shim: {
        jquery: {
            exports: 'jquery',
        },
        angular: {
            exports: 'angular',
        },
        ngRoute: {
            deps: ['angular'],
        },
        'js/listcontrol': {
            exports: 'Microsoft.Office.Controls',
            deps: [
                'jquery',
                'angular',
                'css!assets/css/listcontrol.css',
            ],
        },
    }
});

