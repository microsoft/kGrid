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

* Hit issue: vector.release(); TypeError: undefined is not a function. See [here](https://github.com/winjs/winjs/issues/922) for more details  
Replace in file node_modules\grunt-ts\node_modules\typescript\bin\tsc.js
this.bits.length = 0; ==> this.bits.splice(0, this.bits.length);
this.vectors.length = 0; ==> this.vectors.splice(0, this.vectors.length);

