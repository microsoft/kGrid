module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);
    var path = require('path');
    var buildDir = 'build';
    var installDir = 'install';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            concat_listcontrol: {
                files: ['<%= concat.listcontrol.src %>'],
                tasks: ['concat:listcontrol']
            },
            concat_bootstrap: {
                files: ['<%= concat.bootstrap.src %>'],
                tasks: ['concat:bootstrap']
            },
            concat_bootstrap_new: {
                files: ['<%= concat.bootstrap_new.src %>'],
                tasks: ['concat:bootstrap_new']
            },
            ts_dev: {
                files: ['<%= ts.dev.src %>'],
                tasks: ['ts:dev']
            },
            ts_test: {
                files: ['<%= ts.test.src %>'],
                tasks: ['ts:test']
            },
            less: {
                files: ['src/assets/less/listcontrol.less'],
                tasks: ['less:debug']
            },
            copy_dev: {
                files: [
                    'src/htmls/**/*',
                    'lib/**/*',
                    'build/js/dev/**/*.js',
                    'build/assets/css/**/*.css',
                    'src/demo/**/*',
                ],
                tasks: ['copy:dev_install', 'test:jasmine']
            },
            copy_test: {
                files: [
                    'test/**/*.js',
                    'build/js/test/**/*.js',
                ],
                tasks: ['copy:test_install', 'test:jasmine']
            },
            jsdoc: {
                files: [
                    'build/js/dev/**/*.js',
                ],
                tasks: ['jsdoc'],
            },
            configFiles: {
                files: ['Gruntfile.js'],
                options: {
                    reload: true,
                },
            },
        },
        copy: {
            dev_install: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/htmls',
                        src: ['**/*'],
                        dest: path.join(installDir),
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        cwd: 'lib',
                        src: ['*'],
                        dest: path.join(installDir, 'lib'),
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        cwd: 'lib/bower',
                        src: ['**/*'],
                        dest: path.join(installDir, 'lib'),
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        cwd: 'lib/bootstrap_new',
                        src: ['**/*'],
                        dest: path.join(installDir, 'lib/bootstrap_new'),
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        cwd: 'lib/bootstrap',
                        src: ['**/*'],
                        dest: path.join(installDir, 'lib/bootstrap'),
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        cwd: 'build/js/dev',
                        src: ['**/*.js'],
                        dest: path.join(installDir, 'js'),
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        cwd: 'build',
                        src: ['assets/css/**/*.css'],
                        dest: path.join(installDir),
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        cwd: 'src/demo',
                        src: ['**/*.html', '**/*.htm'],
                        dest: path.join(installDir),
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        cwd: 'src/demo',
                        src: ['js/**/*', 'css/**/*'],
                        dest: path.join(installDir, 'demo'),
                        filter: 'isFile'
                    },
                ],
            },
            test_install: {
                files: [
                    {
                        expand: true,
                        cwd: 'test',
                        src: ['**/*.js'],
                        dest: path.join(installDir, 'js/test'),
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        cwd: 'build/js/test',
                        src: ['**/*.js'],
                        dest: path.join(installDir, 'js/test'),
                        filter: 'isFile'
                    },
                ],
            },
        },
        bower: {
            install: {
                options: {
                    targetDir: './lib/bower',
                    cleanup: true,
                },
            },
        },
        clean: ['build', 'install'],
        karma: {
            unit: {
                configFile: 'karma.config.js',
                singleRun: true,
                browsers: ['Chrome', 'IE', 'FireFox']
            }
        },
        jasmine_node: {
            options: {
                forceExit: true,
                match: '.',
                matchall: false,
                extensions: 'js',
                specNameMatcher: 'jasmine.spec',
                jUnit: {
                    report: true,
                    savePath : "reports/jasmine/",
                    useDotNotation: true,
                    consolidate: true
                }
            },
            all: ['install/js/']
        },
        less: {
            debug: {
                options: {
                    paths: ['src/assets/css'],
                },
                files: {
                    'build/assets/css/listcontrol.css' : 'src/assets/less/listcontrol.less',
                    'build/assets/css/enhancedlistcontrol.css' : 'src/assets/less/enhancedlistcontrol.less',
                }
            },
        },
        concat: {
            listcontrol: {
                src: [
                    'src/scripts/copyright.p.ts',
                    'src/scripts/fundamental/head.p.ts',
                    'src/scripts/fundamental/AccumulateTimeoutInvoker.p.ts',
                    'src/scripts/fundamental/BrowserDetector.p.ts',
                    'src/scripts/fundamental/Calculator.p.ts',
                    'src/scripts/fundamental/Coordinate.p.ts',
                    'src/scripts/fundamental/CssTextBuilder.p.ts',
                    'src/scripts/fundamental/Disposer.p.ts',
                    'src/scripts/fundamental/DynamicStylesheet.p.ts',
                    'src/scripts/fundamental/DynamicStylesheetUpdater.p.ts',
                    'src/scripts/fundamental/ErrorUtil.p.ts',
                    'src/scripts/fundamental/EventAttacher.p.ts',
                    'src/scripts/fundamental/EventSite.p.ts',
                    'src/scripts/fundamental/IDisposable.p.ts',
                    'src/scripts/fundamental/IFeature.p.ts',
                    'src/scripts/fundamental/PropertyBag.p.ts',
                    'src/scripts/fundamental/Rect.p.ts',
                    'src/scripts/fundamental/RenderingScheduler.p.ts',
                    'src/scripts/fundamental/StringBuilder.p.ts',
                    'src/scripts/fundamental/TextDirection.p.ts',
                    'src/scripts/fundamental/TextTransformer.p.ts',
                    'src/scripts/fundamental/Theme.p.ts',
                    'src/scripts/fundamental/Updater.p.ts',
                    'src/scripts/fundamental/UpdaterGroup.p.ts',
                    'src/scripts/fundamental/tail.p.ts',
                    'src/scripts/head.p.ts',
                    'src/scripts/definitions.p.ts',
                    'src/scripts/IGridPosition.p.ts',
                    'src/scripts/IGridElement.p.ts',
                    'src/scripts/RowsDataContext.p.ts',
                    'src/scripts/ColumnsDataContext.p.ts',
                    'src/scripts/Grid.p.ts',
                    'src/scripts/GridPosition.p.ts',
                    'src/scripts/GridSelection.p.ts',
                    'src/scripts/GridRender.p.ts',
                    'src/scripts/GridRuntime.p.ts',
                    'src/scripts/TableViewEditOperation.p.ts',
                    'src/scripts/TableViewKeySelectOperation.p.ts',
                    'src/scripts/TableViewMouseSelectOperation.p.ts',
                    'src/scripts/TableViewEditOperation.p.ts',
                    'src/scripts/TableViewReorderColumnOperation.p.ts',
                    'src/scripts/TableViewResizeColumnOperation.p.ts',
                    'src/scripts/TableView.p.ts',
                    'src/scripts/StackView.p.ts',
                    'src/scripts/Operator.p.ts',
                    'src/scripts/Theme.p.ts',
                    'src/scripts/RenderAndEditor.p.ts',
                    'src/scripts/Range.p.ts',
                    'src/scripts/Position.p.ts',
                    'src/scripts/Selection.p.ts',
                    'src/scripts/listcontrol.p.ts',
                    'src/scripts/tail.p.ts',
                    'lib/bower/invoker/src/invoker.ts',
                ],
                dest: 'build/ts/listcontrol.ts'
            },
            bootstrap_new: {
                src: [
                    'src/scripts/bootstrap_new.ts',
                ],
                dest: 'build/ts/bootstrap_new.ts'
            },
            bootstrap: {
                src: [
                    'src/scripts/bootstrap.ts',
                ],
                dest: 'build/ts/bootstrap.ts'
            },
            EnhancedListcontrol: {
                src: [
                    'src/scripts/EnhancedListcontrol.ts',
                ],
                dest: 'build/ts/EnhancedListcontrol.ts'
            },
        },
        ts: {
            dev: {
                src: ['build/ts/listcontrol.ts', 'build/ts/EnhancedListcontrol.ts', 'build/ts/bootstrap.ts', 'build/ts/bootstrap_new.ts', 'inc/*.d.ts'],
                outDir: ['build/js/dev'],
                options: {
                    target: 'es5',
                    // module: 'amd',
                    declaration: false,
                    removeComments: false,
                },
            },
            test: {
                src: ['test/*.ts', 'inc/*.d.ts'],
                outDir: ['build/js/test'],
                options: {
                    target: 'es5',
                    // module: 'amd',
                    declaration: false,
                    removeComments: false,
                },
            },
        },
        uglify: {
            ship: {
                files: {
                    'build/js/dev/listcontrol.min.js': ['build/js/dev/listcontrol.js'],
                },
            },
        },
        jsdoc: {
            dist: {
                src: ['build/js/dev/listcontrol.js'],
                options: {
                    destination: 'doc',
                    readme: 'README.md',
                    configure: 'jsdoc.config.js',
                }
            },
        },
    });

    grunt.registerTask('prepare', ['bower:install']);
    grunt.registerTask('build:debug', ['less:debug', 'concat', 'ts:dev']);
    grunt.registerTask('build:ship', ['less:debug', 'concat', 'ts:dev', 'uglify']);
    grunt.registerTask('build', 'build:debug');
    grunt.registerTask('install:debug', 'copy:dev_install');
    grunt.registerTask('install:ship', 'copy:dev_install');
    grunt.registerTask('install:test', 'copy:test_install');
    grunt.registerTask('install', 'install:debug');
    grunt.registerTask('build:test', ['ts:test']);
    grunt.registerTask('test:karma', ['karma']);
    grunt.registerTask('test:jasmine', ['jasmine_node']);
    grunt.registerTask('test', ['jasmine_node', 'karma']);
    grunt.registerTask('all:debug', ['clean', 'build:debug', 'build:test', 'install:debug', 'install:test', 'test']);
    grunt.registerTask('all:ship', ['clean', 'build:ship', 'build:test', 'install:ship', 'install:test', 'test', 'jsdoc']);
    grunt.registerTask('all', 'all:debug');
    grunt.registerTask('default', function () {
        console.log('Use grunt build to build');
    });
};

