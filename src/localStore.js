var _ = require( "lodash" );
var fs = require( "fs" );
var when = require( "when" );
var path = require( "path" );
var rootApp = path.resolve( "./public/nonstop/package" );
var packages = require( "nonstop-pack" );
var mkdirp = require( "mkdirp" );

var packageList;

mkdirp( rootApp );
packages.getList( rootApp ).then( function( list ) {
	packageList = _.map( list, function( package ) {
		package.simpleVersion = package;
		return package;
	} );
} );

function download( package ) {
	return when.promise( function( resolve, reject ) {
		if( fs.existsSync( package.fullPath ) ) {
			return fs.createReadStream( package.fullPath );
		} else {
			reject( new Error( "No package named '" + package.file +"' found" ) );
		}
	} );
}

function getTermsFor( term ) {
	var terms = _.where( packages.terms( packageList ), function( x ) {
		return _.values( x )[ 0 ] === term;
	} );
	return when.resolve( terms );
}

function getList( filter ) {
	var matches = _.map( packages.find( packageList, filter ), function( info ) {
		return info;
	} );
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
	if( filter ) {
		var matches = packages.find( packageList, filter );
		list = packages.terms( matches );
	} else {
		list = packages.terms();
	}
	return when.resolve( list );
}

function promote( package ) {
	return packages.promote( rootApp, package, packageList )
		.then(
			function( info ) {
				return info;
			}
		);
}

function upload( file ) {
	var packageList = [];
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
		download: download,
		getList: getList,
		getProjects: getProjects,
		getTerms: getTerms,
		getTermsFor: getTermsFor,
		promote: promote,
		upload: upload
	};
};
