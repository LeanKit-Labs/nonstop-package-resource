var _ = require( "lodash" );
var when = require( "when" );
var rethink = require( "rethinkdb" );
var packages = require( "nonstop-pack" );
var connection, connecting;
var table = "package";

function createDb( db ) {
	return rethink
		.dbCreate( db )
		.run( connection );
}

function createTable( db ) {
	return rethink
		.db( db )
		.tableCreate( table )
		.run( connection );
}

function readOp( db ) {
	return connecting
		.then( function() {
			return rethink
				.db( db )
				.table( table );
		} );
}

function scrub( obj ) {
	return _.reduce( obj, function( acc, v, k ) {
		if( v ) {
			acc[ k ] = v;
		}
		return acc;
	}, {} );
}

function setupDb( db ) {
	return rethink
		.dbList()
		.run( connection )
		.then( function( dbs ) {
			if( !_.contains( dbs, db ) ) {
				return createDb( db );
			} else {
				return;
			}
		} )
		.then( function() {
			return rethink
				.db( db )
				.tableList()
				.run( connection )
				.then( function( tables ) {
					if( !_.contains( tables, "package" ) ) {
						return createTable( db, "package" );
					} else {
						return;
					}
				} );
		} );
}

function addPackage( db, package ) {
	package.id = package.file;
	package.simpleVersion = package.version.split( "-" )[ 0 ];
	console.log( package );
	return rethink
		.db( db )
		.table( table )
		.insert( scrub( package ) )
		.run( connection )
		.then(
			function( x ) {
				console.log( x );
				return x;
			},
			function( err ) {
				console.log( ":(", err.stack );
				return err;
			}
		);
}

function addPromoted( db, package ) {
	package.id = package.file;
	package.simpleVersion = package.version.split( "-" )[ 0 ];
	return rethink
		.db( db )
		.table( table )
		.insert( scrub( package ) )
		.run( connection );
}

function getTermsFor( db, term ) {
	return readOp( db )
		.then( function( x ) {
			return x
				.pluck( term )
				.run( connection )
				.then( function( result ) {
					return result.toArray();
				} );
		} );
}

function getList( db, filter ) {
	return readOp( db )
		.then( function( x ) {
			if( filter.releaseOnly ) {
				delete filter.releaseOnly;
				filter.build = null;
			}
			return x
				.filter( filter, { default: true } )
				.run( connection )
				.then( function( result ) {
					return result.toArray();
				} );
		} );
}

function getProjects( db, filter ) {
	return readOp( db )
		.then( function( x ) {
			if( filter.releaseOnly ) {
				delete filter.releaseOnly;
				filter.build = null;
			}
			return x
				.filter( filter, { default: true } )
				.pluck( "project" )
				.run( connection )
				.then( function( result ) {
					return result.toArray()
						.then( function( list ) {
							return _.unique( _.pluck( list, "project" ) );
						} );
				} );
		} );
}

function getTerms( db, filter ) {
	return readOp( db )
		.then( function( x ) {
			var y = x;
			if( !_.isEmpty( filter ) ) {
				y = x.filter( filter );
			}
			return y
				.run( connection )
				.then( function( result ) {
					return result.toArray()
						.then( function( list ) {
							return packages.terms( list );
						} );
				} );
		} );
}

function promote( db, package ) {
	var file = package.file.replace( /([0-9][.][0-9][.][0-9])[~][0-9]{1,3}/, "$1~" );
	return when.resolve( packages.parse( "./", file ) );
}

function upload( db, file ) {
	return when.resolve( packages.parse( "./", file.originalname ) );
}

module.exports = function( config ) {
	var db = config.rethink.database || "nonstop";
	connecting = rethink.connect( {
		host: config.rethink.host || "localhost",
		port: config.rethink.port || 28015
	} )
	.then( function( c ) {
		connection = c;
		return setupDb( db );
	} );

	return {
		addPackage: addPackage.bind( null, db ),
		addPromoted: addPromoted.bind( null, db ),
		getList: getList.bind( null, db ),
		getProjects: getProjects.bind( null, db ),
		getTerms: getTerms.bind( null, db ),
		getTermsFor: getTermsFor.bind( null, db ),
		promote: promote.bind( null, db ),
		upload: upload.bind( null, db )
	};
};
