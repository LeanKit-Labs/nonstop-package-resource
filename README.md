## nonstop package resource
This module can be used to provide the nonstop package hypermedia API to any [autohost](https://github.com/LeanKit-Labs/autohost) server that's using `hyped`.

### Why?
If you have a client application that you'd like to have installed that auto-updates itself whenever new versions are available - this makes adding the server side support very simple.

### Using with Autohost
NPM install this module to your project

	npm install nonstop-package-resource hyped -S

Add the module to the `modules` property in your autohost init:

```javascript
var hyped = require( 'hyped' );
var host = require( 'autohost' );

host.init( {
		port: 8888,
		noOptions: true,
		urlStrategy: hyped.urlStrategy,
		modules: [ 'nonstop-package-resource' ]
	} )
	.then( hyped.addResources );
hyped.setupMiddleware( host );
```

### Consuming
To consume this API from Node, please look at [nonstop-index-client](https://github.com/LeanKit-Labs/nonstop-index-client). It uses [halon](https://github.com/LeanKit-Labs/halon) to discover the API this makes available via [hyped](https://github.com/LeanKit-Labs/hyped).

## API
The API this adds is relatively straight-forward. It allows for

### Download By Filter
If you know the criteria for uniquely identifying a file (project, owner, branch, version or slug), you can provide the criteria via query parameters to get the matching file.

```bash
GET /package?project=test&owner=me&branch=master&version=0.1.0-1

GET /package?slug=1da43f9
```

### Download By File Name
If you know the filename, it can be provided in the URL path for the get.

```bash
GET /package/test~my~develop~53688240~0.1.0~1~linux~any~any~x64.tar.gz
```

### List Packages
This allows you to find packages that match the criteria provided via query parameters. It sorts the results by the semantic version of the packages from the newest to oldest.

```bash
GET /package?project=test&owner=your&branch=feature-branch&version=0.1.0-1
```

### List Projects
Provides a unique set of projects that match the criteria. Useful for finding all a particular owner's projects or seeing the builds for a particular slug.

```bash
GET /project?owner=teamMember
```

### List Terms
A way to see all possible values for specific package filters. *Warning* can be time consuming since some storage mechanisms will have to scan all packages to determine the term list. You can limit the terms by providing a filter to only see values across a subset of packages.

```bash
GET /terms?owner=myOrg
```

### Upload
Allows build agents to upload a new package.

```bash
POST /package
```

### Promote
Promotes a package to release. Nonstop builds will _not_ produce a release version, there will always be a build number appended so that packages look like pre-releases to the service hosts. Promoting a package removes the build number and creates a non-pre-release semantic version of that package. Use with caution.

