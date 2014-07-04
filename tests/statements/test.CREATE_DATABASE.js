(function() {
	
	module("CREATE_DATABASE", {
		setup: function() {
			QUnit.stop();
			if (!JSDB.SERVER.loaded) {
				JSDB.events.one("load:server", function() {
					QUnit.start();
				});
			} else {
				QUnit.start();
			}
		},
		teardown: function() {
			QUnit.stop();
			JSDB.query("DROP DATABASE IF EXISTS unitTestingDB;", function() {
				QUnit.start();
			});
		}
	});

	QUnit.asyncTest("CREATE DATABASE unitTestingDB", function(assert) {
		var sql = "CREATE DATABASE unitTestingDB;";
		JSDB.query(
			sql, 
			function() {
				assert.ok(!!JSDB.SERVER.databases.unitTestingDB);
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	QUnit.asyncTest("CREATE DATABASE unitTestingDB (must throw an exception when executed more than once)", function(assert) {
		var sql = "CREATE DATABASE unitTestingDB;";
		expect(0);
		JSDB.query(
			sql, 
			function() {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}, 
			function(error) {
				QUnit.start();
			}
		);
	});

	QUnit.asyncTest("CREATE DATABASE IF NOT EXISTS unitTestingDB (must NOT throw an exception when executed more than once)", function(assert) {
		var sql = "CREATE DATABASE IF NOT EXISTS unitTestingDB;";
		expect(0);
		JSDB.query(
			sql, 
			function() {
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	QUnit.asyncTest("Using SCHEMA instead of DATABASE", function(assert) {
		var sql = "DROP SCHEMA IF EXISTS unitTestingDB;" + 
			"CREATE SCHEMA IF NOT EXISTS unitTestingDB;";
		expect(0);
		JSDB.query(
			sql, 
			function() {
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});
})();
