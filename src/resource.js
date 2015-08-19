var _ = require( "lodash" );
var path = require( "path" );
var packages = require( "nonstop-pack" );
var rootApp = path.resolve( "./public/nonstop/package" );
var packageList;
var mkdirp = require( "mkdirp" );

mkdirp( rootApp );
packages.getList( rootApp ).then( function( list ) {
	packageList = list;
} );

function getFilter( envelope ) {
	var filter;
	if( _.isEmpty( envelope.data ) ) {
		filter = function( x ) { return x; };
	} else {
		filter = envelope.data;
	}
	if( filter.osVersion === "any" ) {
		delete filter.osVersion;
	}
	if( filter.osName === "any" ) {
		delete filter.osName;
	}
	return filter;
}

function getTermsFor( term ) {
	return _.where( packages.terms( packageList ), function( x ) {
		return _.values( x )[ 0 ] === term;
	} );
}

module.exports = function() {
	return {
		name: "package",
		resources: "public",
		urlPrefix: "/nonstop",
		actions: {
			list: {
				method: "get",
				topic: "packages",
				url: "/package",
				handle: function( envelope ) {
					var filter = getFilter( envelope );
					var matches = _.map( packages.find( packageList, filter ), function( info ) {
						return info;
					} );
					return { data: { packages: _.unique( matches ) } };
				},
				parameters: {
					project: function() { return { choice: getTermsFor( "project" ) }; },
					owner: function() { return { choice: getTermsFor( "owner" ) }; },
					branch: function() { return { choice: getTermsFor( "branch" ) }; },
					slug: function() { return { choice: getTermsFor( "slug" ) }; },
					version: function() { return { choice: getTermsFor( "version" ) }; },
					build: function() { return { choice: getTermsFor( "build" ) }; },
					platform: function() { return { choice: getTermsFor( "platform" ) }; },
					architecture: function() { return { choice: getTermsFor( "architecture" ) }; }
				}
			},
			projects: {
				method: "get",
				topic: "projects",
				url: "/project",
				handle: function( envelope ) {
					var filter = getFilter( envelope );
					var matches = _.map( packages.find( packageList, filter ), function( info ) {
						return info.project;
					} );
					return { data: { project: matches } };
				},
				parameters: {
					owner: function() { return { choice: getTermsFor( "owner" ) }; },
					branch: function() { return { choice: getTermsFor( "branch" ) }; },
					slug: function() { return { choice: getTermsFor( "slug" ) }; },
					version: function() { return { choice: getTermsFor( "version" ) }; },
					build: function() { return { choice: getTermsFor( "build" ) }; },
					platform: function() { return { choice: getTermsFor( "platform" ) }; },
					architecture: function() { return { choice: getTermsFor( "architecture" ) }; }
				}
			},
			terms: {
				method: "get",
				topic: "terms",
				url: "/terms",
				handle: function( envelope ) {
					if( _.isEmpty( envelope.data ) ) {
						return { data: { terms: packages.terms( packageList ) } };
					} else {
						var matches = packages.find( packageList, envelope.data );
						return { data: { terms: packages.terms( matches ) } };
					}
				}
			},
			upload: {
				method: "post",
				url: "/package",
				handle: function( envelope ) {
					try {
						if( envelope.files ) {
							var uploaded = _.keys( envelope.files )[ 0 ];
							var	file = envelope.files[ uploaded ];
							if( file.extension === "gz" ) {
								return packages.copy( rootApp, file.path, file.originalname, packageList )
										.then( function() {
											return { data: { message: "Package upload completed successfully!" , status: 200 } };
										} )
										.then( null, function( err ) {
											console.log( "File transfer error:", err.stack );
											return { data: { message: "An error occurred during file transfer." }, status: 500 };
										} );
							} else {
								return { data: { message: "Package is invalid" }, status: 400 };
							}
						} else {
							return { data: { message: "No file was present" }, status: 400 };
						}
					} catch( e ) {
						console.log( "Error during package upload:", e.stack );
						return { data: { message: "An exception occurred during upload." }, status: 500 };
					}
				}
			}
		}
	};
};
