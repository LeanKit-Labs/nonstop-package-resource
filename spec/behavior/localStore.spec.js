require( "../setup.js" );

var packages = [
	{
		owner: "dev-1",
		project: "project-1",
		branch: "develop",
		version: "0.1.0",
		build: "1",
		file: "test.tar.gz",
		fullPath: "/a/path/to/a/thing"
	},
	{
		owner: "dev-1",
		project: "project-1",
		branch: "develop",
		version: "0.1.0",
		build: "2",
		file: "test.tar.gz",
		fullPath: "/a/path/to/a/thing"
	},
	{
		owner: "dev-2",
		project: "project-1",
		branch: "develop",
		version: "0.1.1",
		build: "1",
		file: "test.tar.gz",
		fullPath: "/a/path/to/a/thing"
	},
	{
		owner: "dev-2",
		project: "project-1",
		branch: "develop",
		version: "0.1.2",
		build: "1",
		file: "test.tar.gz",
		fullPath: "/a/path/to/a/thing"
	},
	{
		owner: "dev-2",
		project: "project-1",
		branch: "develop",
		version: "0.1.2",
		build: "2",
		file: "test.tar.gz",
		fullPath: "/a/path/to/a/thing"
	}
];

describe( "Local Store", function() {

	var packageLib = {
		copy: _.noop,
		find: _.noop,
		getList: function() {
			return { then: function( cb ) { cb( packages ); } };
		},
		promote: _.noop,
		terms: _.noop
	};

	var fs = {
		createReadStream: _.noop,
		existsSync: _.noop,
		mkdirpSync: _.noop
	};


	var localStore = proxyquire( "../src/localStore", {
		"nonstop-pack": packageLib,
		"fs-extra": fs
	} )();

	describe( "when downloading file that exists", function() {
		var fsMock;
		before( function() {
			fsMock = sinon.mock( fs );
			fsMock.expects( "existsSync" )
				.withArgs( "/a/path/to/a/thing" )
				.returns( true );
			fsMock.expects( "createReadStream" )
				.withArgs( "/a/path/to/a/thing" )
				.returns( true );
		} );

		it( "should return a readstream", function() {
			return localStore.download( packages[ 1 ] )
				.should.eventually.equal( true );
		} );

		it( "should check for file existence and create a readstream", function() {
			fsMock.verify();
		} );
	} );

	describe( "when downloading missing file", function() {
		var fsMock;
		before( function() {
			fsMock = sinon.mock( fs );
			fsMock.expects( "existsSync" )
				.withArgs( "/a/path/to/a/thing" )
				.returns( false );
			fsMock.expects( "createReadStream" )
				.never();
		} );

		it( "should reject with an error", function() {
			return localStore.download( packages[ 1 ] )
				.should.be.rejectedWith( "Error: No package named 'test.tar.gz'" );
		} );

		it( "should check for file existence", function() {
			fsMock.verify();
		} );
	} );

	describe( "when getting all values for a term", function() {
		var packagesMock;
		before( function() {
			packagesMock = sinon.mock( packageLib );
			packagesMock.expects( "terms" )
				.withArgs( packages )
				.returns( [ { "1": "build" }, { "2": "build" }, { "3": "buhtatoe" } ] );
		} );

		it( "should return valid values for build term", function() {
			return localStore.getTermsFor( "build" ).should.eventually.eql( [ "1", "2" ] );
		} );

		it( "should call packages terms", function() {
			return packagesMock.verify();
		} );
	} );

	describe( "when getting list of packages based on filter", function() {
		var packagesMock, result;
		before( function() {
			var filter = {
				owner: "dev-2"
			};
			result = [
				packages[ 4 ],
				packages[ 3 ],
				packages[ 2 ]
			];
			packagesMock = sinon.mock( packageLib );
			packagesMock.expects( "find" )
				.withArgs( packages, filter )
				.returns( result );
		} );

		it( "should return unique results in descending order", function() {
			return localStore.getList( { owner: "dev-2" } )
				.should.eventually.eql( result );
		} );

		it( "should call packages getList", function() {
			packagesMock.verify();
		} );
	} );

	describe( "when getting list of packages with no filter", function() {
		var packagesMock, result;
		before( function() {
			var filter = {};
			result = [
				packages[ 4 ],
				packages[ 3 ],
				packages[ 2 ],
				packages[ 1 ],
				packages[ 0 ]
			];
			packagesMock = sinon.mock( packageLib );
			packagesMock.expects( "find" )
				.withArgs( packages, filter )
				.returns( result );
		} );

		it( "should return unique results in descending order", function() {
			return localStore.getList( {} )
				.should.eventually.eql( result );
		} );

		it( "should call packages getList", function() {
			packagesMock.verify();
		} );
	} );

	describe( "when getting a list of filtered projects", function() {
		var packagesMock, result;
		before( function() {
			var filter = {
				owner: "dev-2"
			};
			result = [
				packages[ 4 ],
				packages[ 3 ],
				packages[ 2 ]
			];
			packagesMock = sinon.mock( packageLib );
			packagesMock.expects( "find" )
				.withArgs( packages, filter )
				.returns( result );
		} );

		it( "should return unique results in descending order", function() {
			return localStore.getProjects( { owner: "dev-2" } )
				.should.eventually.eql( [ "project-1" ] );
		} );

		it( "should call packages getList", function() {
			packagesMock.verify();
		} );
	} );

	describe( "when getting a list of all projects", function() {
		var packagesMock, result;
		before( function() {
			var filter = {};
			result = [
				packages[ 4 ],
				packages[ 3 ],
				packages[ 2 ],
				packages[ 1 ],
				packages[ 0 ]
			];
			packagesMock = sinon.mock( packageLib );
			packagesMock.expects( "find" )
				.withArgs( packages, filter )
				.returns( result );
		} );

		it( "should return unique results in descending order", function() {
			return localStore.getProjects( {} )
				.should.eventually.eql( [ "project-1" ] );
		} );

		it( "should call packages getList", function() {
			packagesMock.verify();
		} );
	} );

	describe( "when getting all terms", function() {
		var packagesMock, result;
		before( function() {
			var filter = {};
			result = [
				{ "project-1": "project" },
				{ "dev-1": "owner" },
				{ "dev-2": "owner" },
				{ "develop": "branch" },
				{ "1": "build" },
				{ "2": "build" },
				{ "0.1.0": "version" },
				{ "0.1.1": "version" },
				{ "0.1.2": "version" }
			];
			packagesMock = sinon.mock( packageLib );
			packagesMock.expects( "terms" )
				.withArgs( packages )
				.returns( result );
			packagesMock.expects( "find" ).never();
		} );

		it( "should return unique results in descending order", function() {
			return localStore.getTerms( {} )
				.should.eventually.eql( result );
		} );

		it( "should call packages terms only", function() {
			packagesMock.verify();
		} );
	} );

	describe( "when getting terms for fitlered packages ", function() {
		var packagesMock, result;
		before( function() {
			var filter = {
				owner: "dev-1"
			};
			var subSet = [
				packages[ 1 ],
				packages[ 0 ]
			];
			result = [
				{ "project-1": "project" },
				{ "dev-1": "owner" },
				{ "develop": "branch" },
				{ "1": "build" },
				{ "2": "build" },
				{ "0.1.0": "version" }
			];
			packagesMock = sinon.mock( packageLib );
			packagesMock.expects( "terms" )
				.withArgs( subSet )
				.returns( result );
			packagesMock.expects( "find" )
				.withArgs( packages, filter )
				.returns( subSet );
		} );

		it( "should return unique term list", function() {
			return localStore.getTerms( { "owner": "dev-1" } )
				.should.eventually.eql( result );
		} );

		it( "should call packages find and terms", function() {
			packagesMock.verify();
		} );
	} );
} );
