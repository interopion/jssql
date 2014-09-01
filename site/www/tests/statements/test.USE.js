(function() {
	
	module("USE", {
		setup: function() {
			QUnit.stop();
			jsSQL(function(api) {
				api.query("CREATE DATABASE IF NOT EXISTS unitTestingDB", function(err) {
					if (err)
						QUnit.pushFailure("setup failed: " + err);
					QUnit.start();
				});
			});
		},
		teardown: function() {
			QUnit.stop();
			jsSQL(function(api) {
				api.query("DROP DATABASE IF EXISTS unitTestingDB", function(err) {
					if (err)
						QUnit.pushFailure("setup failed: " + err);
					QUnit.start();
				});
			});
		}
	});

	QUnit.asyncTest("USE unitTestingDB", function(assert) {
		var sql = [
				"USE unitTestingDB",
				"USE \"unitTestingDB\"",
				"USE 'unitTestingDB'",
				"USE `unitTestingDB`"
			],
			len = sql.length;

		jsSQL(function(api) {
			api.query(sql, function(err, result, queryIndex) {
				var db = api.getCurrentDatabase();

				if (err)
					QUnit.pushFailure(err, sql[queryIndex]);

				assert.ok(
					db && db.name == "unitTestingDB", 
					'Query ' + sql[queryIndex] + ' selects a database named "unitTestingDB"'
				);

				if (queryIndex == len - 1)
					QUnit.start();
			});
		});
	});

	QUnit.asyncTest("USE NonExistingDB", function(assert) {
		var sql = "USE NonExistingDB";
		jsSQL(function(api) {
			api.query(sql, function(err, result) {
				QUnit.ok(!!err, "Failed as expected (" + sql + ")");
				QUnit.start();
			});
		});
	});
})();
