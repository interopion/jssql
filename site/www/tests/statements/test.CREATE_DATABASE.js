(function() {
	
	module("CREATE_DATABASE", {
		setup: function() {
			QUnit.stop();//debugger;
			jsSQL(function(API) {
				API.query("DROP DATABASE IF EXISTS unitTestingDB", function(err) {
					if (err)
						QUnit.pushFailure("setup failed: " + err);
					QUnit.start();
				});
			});
		},
		teardown: function() {
			QUnit.stop();
			jsSQL(function(API) {
				API.query("DROP DATABASE IF EXISTS unitTestingDB", function(err) {
					if (err)
						QUnit.pushFailure("teardown failed: " + err);
					QUnit.start();
				});
			});
		}
	});

	QUnit.asyncTest("CREATE DATABASE unitTestingDB", function(assert) {
		jsSQL(function(API) {
			var sql = "CREATE DATABASE unitTestingDB";
			API.query(
				sql, 
				function(err, result) {
					if (err) {
						QUnit.pushFailure(String(err || "Failed"), sql);	
					} else {
						assert.ok(API.getDatabase("unitTestingDB"));
					}
					QUnit.start();
				}
			);
		});
	});

	QUnit.asyncTest(
		"CREATE DATABASE unitTestingDB (must throw an exception when executed more than once)", 
		function(assert) {
			jsSQL(function(API) {
				var sql = [
					"CREATE DATABASE unitTestingDB;",
					"CREATE DATABASE unitTestingDB;"
				].join("");
				
				API.query(
					sql, 
					function(err, result, qIndex) {
						if (qIndex === 1) {
							assert.ok(!!err, "Failed as expected: " + err);
							QUnit.start();
						}
					}
				);
			});
		}
	);
	
	QUnit.asyncTest(
		"CREATE DATABASE IF NOT EXISTS unitTestingDB (must NOT throw an exception when executed more than once)", 
		function(assert) {
			jsSQL(function(API) {
				var sql = [
					"CREATE DATABASE unitTestingDB;",
					"CREATE DATABASE IF NOT EXISTS unitTestingDB;"
				].join("");
				
				API.query(sql, function(err, result, qIndex) {
					if (qIndex === 1) {
						assert.ok(!err, "Must not fail");
						QUnit.start();
					}
				});
			});
		}
	);

	QUnit.asyncTest("Using SCHEMA instead of DATABASE", function(assert) {
		var sql = "CREATE SCHEMA IF NOT EXISTS unitTestingDB;";
		jsSQL(function(API) {
			API.query(sql, function(err, result, qIndex) {
				assert.ok(!err, "Must not fail");
				QUnit.start();
			});
		});
	});

})();
