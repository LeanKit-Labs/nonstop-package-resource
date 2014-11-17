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