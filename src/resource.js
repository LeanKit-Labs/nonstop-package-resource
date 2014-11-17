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
					envelope.hyped( { packages: _.unique( matches ) } ).render();
				},
				parameters: {
					project: function() { return { choice: getTermsFor( "project" ) }; },
					owner: function() { return { choice: getTermsFor( "owner" ) }; },
					branch: function() { return { choice: getTermsFor( "branch" ) }; },
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
					envelope.hyped( { project: matches } ).render();
				},
				parameters: {
					owner: function() { return { choice: getTermsFor( "owner" ) }; },
					branch: function() { return { choice: getTermsFor( "branch" ) }; },
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
						envelope.reply( { data: packages.terms( packageList ) } );	
					} else {
						var matches = packages.find( packageList, envelope.data );
						envelope.hyped( { terms: packages.terms( matches ) } ).render();	
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
							packages.copy( rootApp, file.path, file.originalname, packageList )
									.then( function() {
										envelope.hyped( { message: "Upload completed successfully" } ).render();
									} )
									.then( null, function( err ) {
										envelope.hyped( { message: "An error occurred during file transfer" } ).status( 500 ).render();
									} );
						} else {
							envelope.hyped( { message: "Will not accept invalid package" } ).status( 400 ).render();
						}
					} else {
						envelope.hyped( { message: "No file present in request" } ).status( 400 ).render();
					}
					} catch( e ) {
						console.log( ":,(", e.stack );
					}
				}
			}
		}
	};
};