(function() {
	
	module("USE", {
		setup: function() {
			QUnit.stop();
			if (!JSDB.SERVER.loaded) {
				JSDB.events.one("load:server", function() {
					JSDB.query("CREATE DATABASE IF NOT EXISTS unitTestingDB;", function() {
						QUnit.start();
					});
				});
			} else {
				JSDB.query("CREATE DATABASE IF NOT EXISTS unitTestingDB;", function() {
					QUnit.start();
				});
			}
		},
		teardown: function() {
			QUnit.stop();
			JSDB.query("DROP DATABASE IF EXISTS unitTestingDB;", function() {
				QUnit.start();
			});
		}
	});

	QUnit.asyncTest("USE unitTestingDB", function(assert) {
		var queries = [
				"USE unitTestingDB;",
				"USE \"unitTestingDB\";",
				"USE 'unitTestingDB';",
				"USE `unitTestingDB`;"
			],
			len = queries.length,
			sql = queries.join("");

		JSDB.query(
			sql, 
			function(result, queryIndex) {
				var db = JSDB.SERVER.getCurrentDatabase();
				assert.ok(
					db && db.name == "unitTestingDB", 
					'Query ' + queries[queryIndex] + ' selects a database named "unitTestingDB"'
				);
				if (queryIndex == len - 1)
					QUnit.start();
			}, 
			function(error, queryIndex) {
				QUnit.pushFailure(error.message || "Failed", sql);
				if (queryIndex == len - 1)
					QUnit.start();
			}
		);
	});

	QUnit.asyncTest("USE NonExistingDB", function(assert) {
		var sql = "USE NonExistingDB;";
		//expect(0);
		JSDB.query(
			sql, 
			function() {
				QUnit.pushFailure("Failed (called onSuccess callback while the DB does not exist)", sql);
				if (QUnit.config.semaphore)
					QUnit.start();
			}, 
			function(error) {
				QUnit.push(true, error, error, "Must fail: " + error);
				if (QUnit.config.semaphore)
					QUnit.start();
			}
		);
	});
})();
