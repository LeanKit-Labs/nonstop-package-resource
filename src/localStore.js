var _ = require( "lodash" );
var fs = require( "fs-extra" );
var when = require( "when" );
var path = require( "path" );
var rootApp = path.resolve( "./public/nonstop/package" );
var packages = require( "nonstop-pack" );

var packageList;

fs.mkdirpSync( rootApp );
packages.getList( rootApp )
	.then( function( list ) {
		packageList = _.map( list, function( package ) {
			package.simpleVersion = package.version.split( "-" )[ 0 ];
			return package;
		} );
	} );

function addPromoted() {
	// doesn't need to do anything at the moment
}

function download( package ) {
	return when.promise( function( resolve, reject ) {
		if( fs.existsSync( package.fullPath ) ) {
			resolve( fs.createReadStream( package.fullPath ) );
		} else {
			reject( new Error( "No package named '" + package.file +"' found" ) );
		}
	} );
}

function getTermsFor( term ) {
	var terms = _.reduce( packages.terms( packageList ), function( acc, x ) {
		var values = _.values( x );
		if( values[ 0 ] === term ) {
			acc.push( _.keys( x )[ 0 ] );
		}
		return acc;
	}, [] );
	return when.resolve( terms );
}

function getList( filter ) {
	var matches = packages.find( packageList, filter );
	return when.resolve( _.unique( matches ) );
}

function getProjects( filter ) {
	var matches = _.map( packages.find( packageList, filter ), function( info ) {
		return info.project;
	} );
	return when.resolve( _.unique( matches ) );
}

function getTerms( filter ) {
	var list;
	if( _.isEmpty( filter ) ) {
		list = packages.terms( packageList );
	} else {
		var matches = packages.find( packageList, filter );
		list = packages.terms( matches );
	}
	return when.resolve( list );
}

function promote( package ) {
	return packages.promote( rootApp, package, packageList );
}

function upload( file ) {
	try {
		return packages.copy( rootApp, file.path, file.originalname, packageList )
			.then(
				function() {
					return when.resolve( true );
				},
				function( err ) {
					console.log( "File transfer error:", err.stack );
					return when.resolve( false );
				}
			);
	} catch( e ) {
		console.log( "Error during package upload:", e.stack );
		return when.resolve( false );
	}
}

module.exports = function() {
	return {
		addPromoted: addPromoted,
		download: download,
		getList: getList,
		getProjects: getProjects,
		getTerms: getTerms,
		getTermsFor: getTermsFor,
		promote: promote,
		upload: upload
	};
};
