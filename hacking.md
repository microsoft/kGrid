## Q & A

* If you meet problem in installing jsdom, which says VS 2010 tools not found blablabla.  
```Batchfile
    npm install jsdom --msvs_version=2013
```

* Hit issue: *Failed to execute "jasmine.executeSpecsInFolder": TypeError: undefined is not a function*. See [here](https://mamascode.wordpress.com/2014/07/08/jasmine-node-1-7-x-is-dead/) for more details  
```Batchfile
    cd node_modules\grunt-jasmine-node\node_modules\jasmine-node\node_modules
    rd /s jasmine-reporters
    npm install jasmine-reporters@0.4.1
```
