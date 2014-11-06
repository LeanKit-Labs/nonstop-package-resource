var _ = require( "lodash" );
var path = require( "path" );
var packages = require( "nonstop-pack" );
var rootApp = path.resolve( "./public/package" );
var packageList;

packages.getList( rootApp ).then( function( list ) {
	packageList = list;
} );

module.exports = function() {
	return {
		name: "package",
		resources: "public",
		actions: {
			project: {
				method: "get",
				topic: "project",
				url: "/package",
				handle: function( envelope ) {
					var filter;
					if( _.isEmpty( envelope.data ) ) {
						filter = function( x ) { return x; };
					} else {
						filter = envelope.data;
					}
					var matches = _.map( packages.find( packageList, filter ), function( info ) {
						return info.project;
					} );
					envelope.reply( { data: _.unique( matches ) } );
				}
			},
			list: {
				method: "get",
				topic: "list",
				url: "/list",
				handle: function( envelope ) {
					var matches = _.map( packages.find( packageList, envelope.data ), function( info ) {
						return info;
					} );
					envelope.reply( { data: matches } );
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
						envelope.reply( { data: packages.terms( matches ) } );	
					}
					
				}
			},
			upload: {
				method: "post",
				url: "/package/:packageName",
				handle: function( envelope ) {
					try {
					if( envelope.files ) {
						var uploaded = _.keys( envelope.files )[ 0 ];
						var	file = envelope.files[ uploaded ];
						if( file.extension === ".gz" ) {
							packages.copy( rootApp, file.url, file.originalname, packageList )
									.then( function() {
										envelope.reply( { data: "Upload completed successfully" } );
									} )
									.then( null, function( err ) {
										envelope.reply( { statusCode: 500, data: err } );
									} );
						} else {
							envelope.reply( { statusCode: 400, data: "Will not accept invalid package" } );
						}
					} else {
						envelope.reply( { statusCode: 400, data: "No file present in request" } );
					}
					} catch( e ) {
						console.log( ":,(", e.stack );
					}
				}
			}
		}
	};
};