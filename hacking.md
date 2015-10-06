## Q & A

* If you meet problem in installing jsdom, which says VS 2010 tools not found blablabla.  
```Batchfile
    'C:\Program Files (x86)\Microsoft Visual Studio 12.0\Common7\Tools\vsvars32.bat'
    npm install jsdom@3 --msvs_version=2013
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

* Hit issue: TRACKER : error TRK0005: Failed to locate: "CL.exe". The system cannot find the file specified.
Check if you are using VS2015. It doesn't install C++ compiler by default. You should go to control panel to modify the installed feature of VS2015.++
See [here](https://social.msdn.microsoft.com/Forums/vstudio/en-US/8198fcde-caab-445e-95fb-f30765be008d/cannot-find-clexe-file?forum=visualstudiogeneral) for more details

