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
		var sql = "USE unitTestingDB;USE \"unitTestingDB\";USE 'unitTestingDB';USE `unitTestingDB`;";
		JSDB.query(
			sql, 
			function() {
				var db = JSDB.SERVER.getCurrentDatabase();
				assert.ok(db && db.name == "unitTestingDB");
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	QUnit.asyncTest("USE NonExistingDB", function(assert) {
		var sql = "USE NonExistingDB;";
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
})();
