var s3 = require( "s3" );
var _ = require( "lodash" );
var fs = require( "fs-extra" );
var when = require( "when" );
var format = require( "util" ).format;
var packages = require( "nonstop-pack" );

function addPromoted( client, bucket, package ) {
	// doesn't do anything at the moment
}

function download( client, bucket, package ) {
	return when.promise( function( resolve, reject ) {
		var readableStream = client.downloadStream( {
			Bucket: bucket,
			Key: package.file
		} )
		.on( "error", function( err ) {
			console.log( err.stack );
		} )
		.on( "httpHeaders", function( status ) {
			if( status < 300 ) {
				resolve( readableStream );
			} else {
				var error = format( "Failed to create stream from S3 for file '%s'", package.file );
				console.log( error );
				reject( new Error( error ) );
			}
		} );
	} );
}

function getTermsFor( client, bucket, term ) {
	return getList( client, bucket, {} )
		.then( function( list ) {
			var terms = _.reduce( packages.terms( list ), function( acc, x ) {
				var values = _.values( x );
				if( values[ 0 ] === term ) {
					acc.push( _.keys( x )[ 0 ] );
				}
				return acc;
			}, [] );
			return terms;
		} );
}

function getList( client, bucket, filter ) {
	var list = [];
	return when.promise( function( resolve, reject ) {
		client.listObjects( {
			s3Params: {
				Bucket: bucket
			}
		} )
		.on( "error", function( err ) {
			reject( err );
		} )
		.on( "end", function() {
			resolve( _.unique( packages.find( list, filter ) ) );
		} )
		.on( "data", function( results ) {
			_.map( results.Contents, function( item ) {
				var package = packages.parse( "./", item.Key );
				package.simpleVersion = package.version.split( "-" )[ 0 ];
				list.push( package );
			} );
		} );
	} );
}

function getProjects( client, bucket, filter ) {
	return getList( client, bucket, filter )
		.then( function( list ) {
			return _.unique( _.pluck( list, "project" ) );
		} );
}

function getTerms( client, bucket, filter ) {
	return getList( client, bucket, filter )
		.then( function( list ) {
			return packages.terms( list );
		} );
}

function promote( client, bucket, package ) {
	var originalFile = _.clone( package.file );
	var file = package.file.replace( /([0-9][.][0-9][.][0-9])[~][0-9]{1,3}/, "$1~" );
	return when.promise( function( resolve, reject ) {
		client.copyObject( {
			Bucket: bucket,
			Key: file,
			CopySource: format( "/%s/%s", bucket, originalFile )
		} )
		.on( "error", function( err ) {
			console.log( "Error promoting package (s3 object copy):", err.stack );
			reject( err );
		} )
		.on( "end", function() {
			resolve( packages.parse( "./", file ) );
		} );
	} );
}

function upload( client, bucket, file ) {
	return when.promise( function( resolve, reject ) {
		client.uploadFile( {
			localFile: file.path,
			s3Params: {
				Bucket: bucket,
				Key: file.originalname
			}
		} )
		.on( "error", function( err ) {
			console.log( "Error during package upload:", err.stack );
			fs.remove( file.path );
			reject( undefined );
		} )
		.on( "end", function() {
			fs.remove( file.path );
			resolve( packages.parse( "./", file.originalname ) );
		} );
	} );
}

module.exports = function( config ) {
	var bucket = config.s3.bucket;
	var client = s3.createClient( {
		s3Options: {
			accessKeyId: config.s3.id,
			secretAccessKey: config.s3.key
		}
	} );

	return {
		addPackage: _.noop,
		addPromoted: addPromoted.bind( null, client, bucket ),
		download: download.bind( null, client, bucket ),
		getList: getList.bind( null, client, bucket ),
		getProjects: getProjects.bind( null, client, bucket ),
		getTerms: getTerms.bind( null, client, bucket ),
		getTermsFor: getTermsFor.bind( null, client, bucket ),
		promote: promote.bind( null, client, bucket ),
		upload: upload.bind( null, client, bucket )
	};
};
