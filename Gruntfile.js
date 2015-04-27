module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);
    var path = require('path');
    var buildDir = 'build';
    var installDir = 'install';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            concat_debug: {
                files: ['<%= concat.debug.src %>'],
                tasks: ['concat:debug']
            },
            ts_debug: {
                files: ['<%= ts.debug.src %>'],
                tasks: ['ts:debug']
            },
            ts_test: {
                files: ['<%= ts.test.src %>'],
                tasks: ['ts:test']
            },
            less: {
                files: ['src/assets/less/listcontrol.less'],
                tasks: ['less:debug']
            },
            copy: {
                files: [
                    'src/htmls/**/*',
                    'lib/**/*',
                    'build/js/**/*.js',
                    'build/assets/css/**/*.css',
                    'src/demo/**/*',
                ],
                tasks: ['copy:install', 'jasmine_node']
            },
            configFiles: {
                files: ['Gruntfile.js'],
                options: {
                    reload: true,
                },
            },
        },
        copy: {
            install: {
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
                        src: ['test/**/*.js'],
                        dest: path.join(installDir, 'js'),
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        cwd: 'build',
                        src: ['js/**/*.js', 'assets/css/**/*.css'],
                        dest: path.join(installDir),
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        cwd: 'src/demo',
                        src: ['**/*.html'],
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
                ]
            }
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
            all: ['install/js/test/']
        },
        less: {
            debug: {
                options: {
                    paths: ['src/assets/css'],
                },
                files: {
                    'build/assets/css/listcontrol.css' : 'src/assets/less/listcontrol.less',
                }
            },
        },
        concat: {
            debug: {
                src: [
                    'src/scripts/head.p.ts',
                    'src/scripts/support.p.ts',
                    'src/scripts/definitions.p.ts',
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
                ],
                dest: 'build/ts/listcontrol.ts'
            },
        },
        ts: {
            debug: {
                src: ['build/ts/listcontrol.ts', 'inc/*.d.ts'],
                outDir: ['build/js'],
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
                    'build/js/listcontrol.min.js': ['build/js/listcontrol.js'],
                },
            },
        },
    });

    grunt.registerTask('prepare', ['bower:install']);
    grunt.registerTask('install', ['copy:install']);
    grunt.registerTask('build:debug', ['less:debug', 'concat:debug', 'ts:debug', 'install']);
    grunt.registerTask('build:ship', ['less:debug', 'concat:debug', 'ts:debug', 'uglify', 'install']);
    grunt.registerTask('build', 'build:debug');
    grunt.registerTask('test:karma', ['ts:test', 'install', 'karma']);
    grunt.registerTask('test:jasmine', ['ts:test', 'install', 'jasmine_node']);
    grunt.registerTask('test', ['ts:test', 'install', 'jasmine_node', 'karma']);
    grunt.registerTask('all:debug', ['clean', 'prepare', 'less:debug', 'concat:debug', 'ts:debug', 'ts:test', 'install', 'jasmine_node', 'karma']);
    grunt.registerTask('all:ship', ['clean', 'prepare', 'less:debug', 'concat:debug', 'ts:debug', 'uglify', 'ts:test', 'install', 'jasmine_node', 'karma']);
    grunt.registerTask('all', 'all:debug');
    grunt.registerTask('default', function () {
        console.log('Use grunt build to build');
    });
};

