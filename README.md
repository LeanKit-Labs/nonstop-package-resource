## nonstop package resource
This module can be used to provide the nonstop package HTTP API to any autohost server.

### Why?
If you have a client application that you'd like to have installed that auto-updates itself whenever new versions are available - this makes adding the server side support very simple.

### Using with Autohost
NPM install this module to your project

	npm install nonstop-package-resource -S

Add the module to the `modules` property in your autohost init:

```javascript
var host = require( 'autohost' );
host.init( {
		port: 8888,
		modules: [ 'nonstop-package-resource' ]
	} );
```

### Consuming
To consume this API from Node, please look at [nonstop-hub-client](https://github.com/LeanKit-Labs/nonstop-hub-client). You can obviously roll your own, but why bother?

## API

All three of the GET API calls support filtering packages by the same query string parameters:

 * project - project name ( defined in the build file )
 * owner - repository owner
 * branch - repository branch
 * version - version ( '#.#.#' )
 * build - # or 'release'
 * platform - 'darwin', 'linux' or 'win32'
 * architecture - 'x86' or 'x64'
 * osName - user specified, not recommended
 * osVersion - user specified, not recommended

example: /api/package/list?project=test&owner=arobson&branch=master&version=0.1.0&build=release&platform=darwin&architecture=x64

### Find Matching Projects - GET /api/package[?query string]

Returns an array of project names that match the criteria provided in the query string. Making the request without query parameters will return the list of all projects.

### Get Packages - GET /api/package/list[?query string]
Provides a list of packages matching the criteria set by the query string. Sorts the packages by version number in descending order (newest package will be at index 0).

```javascript
[
	{
		"file": "proj1~owner1~branch2~0.1.0~2~darwin~OSX~10.9.2~x64.tar.gz",
		"project": "test",
		"owner": "arobson",
		"branch": "master",
		"version": "0.1.0-2",
		"build": 2,
		"platform": "darwin",
		"osName": "any",
		"osVersion": "any",
		"architecture": "x64"
	},
	{
		"file": "proj1~owner1~branch2~0.1.0~1~darwin~OSX~10.9.2~x64.tar.gz",
		"project": "test",
		"owner": "arobson",
		"branch": "master",
		"version": "0.1.0-1",
		"build": 1,
		"platform": "darwin",
		"osName": "any",
		"osVersion": "any",
		"architecture": "x64"
	}
]
```

### Get Term List - GET /api/package/terms[?query string]

Returns a list of key value pairs where the unqiue values are the keys and the value is the field the value was sourced from. This is a unique list is sourced from all available packages. Applying the query string filter will simply limit the packages that are considered when acquiring the term list.

```javascript
[
	{ "0.1.0": "version" },
	{ "0.1.0": "version" },
	{ "test": "project" },
	{ "arobson": "owner" },
	{ "master": "branch" },
	{ "darwin": "platform" },
	{ 2: "build" },
	{ 1: "build" },
	{ "x64": "architecture" }
]
```

	Note: it is somewhat unlikely you'll make use of this call - it is intended to help with making search tools that know what
	values are possible for a given property describing available packages.

### Upload Package - POST /api/package/:packageName

Use this to upload a package file. That's pretty much it. Ta-da?
