var _ = require( "lodash" );

function getFilter( envelope ) {
	var filter;

	if( _.isEmpty( envelope.data ) ) {
		filter = function( x ) { return x; };
	} else {
		filter = envelope.data;
		var parts = filter.version ? filter.version.split( "-" ) : [];
		if( parts.length > 1 ) {
			filter.simpleVersion = parts[ 0 ];
			filter.build = parts[ 1 ];
		} else if( parts.length === 1 ) {
			filter.simpleVersion = parts[ 0 ];
		}
		delete filter.version;
	}

	if( filter.osVersion === "any" ) {
		delete filter.osVersion;
	}

	if( filter.osName === "any" ) {
		delete filter.osName;
	}
	return filter;
}

function createResource( events, packageStore, packageInfo ) {
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
					return packageInfo.getList( filter )
						.then( function( list ) {
							return { data: { packages: list } };
						} );
				},
				parameters: {
					project: function() { return { choice: packageInfo.getTermsFor( "project" ) }; },
					owner: function() { return { choice: packageInfo.getTermsFor( "owner" ) }; },
					branch: function() { return { choice: packageInfo.getTermsFor( "branch" ) }; },
					slug: function() { return { choice: packageInfo.getTermsFor( "slug" ) }; },
					version: function() { return { choice: packageInfo.getTermsFor( "version" ) }; },
					build: function() { return { choice: packageInfo.getTermsFor( "build" ) }; },
					platform: function() { return { choice: packageInfo.getTermsFor( "platform" ) }; },
					architecture: function() { return { choice: packageInfo.getTermsFor( "architecture" ) }; }
				}
			},
			projects: {
				method: "get",
				topic: "projects",
				url: "/project",
				handle: function( envelope ) {
					var filter = getFilter( envelope );
					return packageInfo.getProjects( filter )
						.then( function( list ) {
							return { data: { project: list } };
						} );
				},
				parameters: {
					owner: function() { return { choice: packageInfo.getTermsFor( "owner" ) }; },
					branch: function() { return { choice: packageInfo.getTermsFor( "branch" ) }; },
					slug: function() { return { choice: packageInfo.getTermsFor( "slug" ) }; },
					version: function() { return { choice: packageInfo.getTermsFor( "version" ) }; },
					build: function() { return { choice: packageInfo.getTermsFor( "build" ) }; },
					platform: function() { return { choice: packageInfo.getTermsFor( "platform" ) }; },
					architecture: function() { return { choice: packageInfo.getTermsFor( "architecture" ) }; }
				}
			},
			terms: {
				method: "get",
				topic: "terms",
				url: "/terms",
				handle: function( envelope ) {
					return packageInfo.getTerms( envelope.data )
						.then( function( terms ) {
							return { data: { terms: terms } };
						} );
				}
			},
			downloadPackage: {
				method: "get",
				url: "/package",
				handle: function( envelope ) {
					var filter = getFilter( envelope );
					return packageInfo.getList( filter )
						.then( function( matches ) {
							if( matches.length === 1 ) {
								var file = matches[ 0 ];
								return packageStore.download( file )
									.then( function( stream ) {
										return {
											file: {
												name: matches[ 0 ].file,
												type: "application/gzip",
												stream: stream
											}
										};
									}, function( err ) {
										console.log( "Error trying to get a file stream for " + file + " : " + err.stack );
										return {
											status: 500,
											data: { message: "An error occurred trying to obtain a file stream to " + file }
										};
									} );
							} else if( matches.length > 0 ) {
								return {
									status: 400,
									data: {
										message: "Criteria provided matched " + matches.length + " packages. Cannot download more than one package",
										count: matches.length,
										matches: _.pluck( matches, "file" )
									}
								};
							} else {
								return {
									status: 404,
									data: { message: "No packages matched the provided criteria" }
								};
							}
						} );
				}
			},
			downloadFile: {
				method: "get",
				url: "/package/:file",
				handle: function( envelope ) {
					var file = envelope.data.file;
					if( file ) {
						return packageInfo.getList( { file: file } )
							.then( function( matches ) {
								var package = matches[ 0 ];
								return packageStore.download( package )
									.then( function( stream ) {
										return {
											file: {
												name: file,
												type: "application/gzip",
												stream: stream
											}
										};
									}, function( err ) {
										console.log( "Error trying to get a file stream for " + file + " : " + err.stack );
										return {
											status: 500,
											data: { message: "An error occurred trying to obtain a file stream to " + file }
										};
									} );
								} );
					} else {
						return {
							status: 400,
							data: { message: "No package was specified for download" }
						};
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
								return packageStore.upload( file )
									.then(
										function( success ) {
											if( events ) {
												events.publish( "package.uploaded",
													_.defaults( packages.parse( rootApp, file.originalname ), { topic: "package.promoted" } ) );
											}
											if( success ) {
												return { data: { message: "Package upload completed successfully!" , status: 200 } };
											} else {
												return { data: { message: "An error occurred during file transfer." }, status: 500 };
											}
										}
									);
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
			},
			promote: {
				method: "put",
				url: "/package",
				handle: function( envelope ) {
					var filter = getFilter( envelope );
					return packageInfo.getList( filter )
						.then( function( matches ) {
							if( matches.length === 1 ) {
								return packageStore.promote( matches[ 0 ] )
									.then(
										function( info ) {
											if( events ) {
												events.publish( "package.promoted",
													_.defaults( info, { topic: "package.promoted" } ) );
											}
											packageInfo.addPromoted( info );
											return {
												data: {
													message: "Package promoted to release",
													promoted: matches[ 0 ].file,
													release: info.file
												}
											};
										},
										function( e ) {
											console.log( "Error during package promotion:", e.stack );
											return {
												status: 500,
												data: {
													message: "Failed to promote package due to error"
												}
											};
										}
									);
							} else if( matches.length > 0 ) {
								return {
									status: 400,
									data: {
										message: "Criteria provided matched " + matches.length + " packages. Cannot promote more than one package",
										count: matches.length,
										matches: _.pluck( matches, "file" )
									}
								};
							} else {
								return {
									status: 404,
									data: { message: "No packages matched the provided criteria" }
								};
							}
						} );
				}
			}
		}
	};
}

module.exports = function( host ) {
	if( !host.fount.canResolve( [ "packageInfo", "packageStore" ] ) ) {
		var internal = require( "./localStore" )();
		host.fount.register( "packageInfo", internal );
		host.fount.register( "pacakgeStore", internal );
	}

	host.fount.resolve( "packageStore", "packageInfo", function( packageStore, packageInfo ) {
		host.http.route( "/nonstop/package/:file", "get", function( req, res ) {
			var file = req.params.file;
			if( file ) {
				return packageInfo.getList( { file: file } )
					.then( function( matches ) {
						var package = matches[ 0 ];
						return packageStore.download( package )
							.then( function( stream ) {
								var headers = {
									"Content-Type": "application/gzip",
									"Content-Disposition": "attachment; filename=\"" + file + "\""
								};
								res.status( 200 );
								res.set( headers );
								stream.pipe( res );
							}, function( err ) {
								console.log( "Error trying to get a file stream for " + file + " : " + err.stack );
								res.status( 500 );
								res.set( { "Content-Type": "application/json" } );
								res.send( JSON.stringify( { message: "An error occurred trying to obtain a file stream to " + file } ) );
							} );
						} );
			} else {
				res.status( 400 );
				res.set( { "Content-Type": "application/json" } );
				res.send( JSON.stringify( { message: "No package was specified for download" } ) );
			}
		} );
	} );

	return host.fount.inject( createResource );
};
