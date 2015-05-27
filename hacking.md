Q & A
1. If you meet problem in installing jsdom, which says VS 2010 tools not found blablabla.
    Use "npm install jsdom --msvs_version=2013"
2. Hit issue: Failed to execute "jasmine.executeSpecsInFolder": TypeError: undefined is not a function
    cd node_modules\grunt-jasmine-node\node_modules\jasmine-node\node_modules
    del jasmine-reporters
    npm install jasmine-reporters@0.4.1
    See [here](https://mamascode.wordpress.com/2014/07/08/jasmine-node-1-7-x-is-dead/) for more details

