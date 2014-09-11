
module("USE", {
	setup: function() {
		QUnit.stop();
		TEST_API.query("CREATE DATABASE IF NOT EXISTS unitTestingDB", function(err) {
			if (err)
				QUnit.pushFailure("setup failed: " + err);
			QUnit.start();
		});
	},
	teardown: function() {
		QUnit.stop();
		TEST_API.query("DROP DATABASE IF EXISTS unitTestingDB", function(err) {
			if (err)
				QUnit.pushFailure("setup failed: " + err);
			QUnit.start();
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

	TEST_API.query(sql, function(err, result, queryIndex) {
		var db = TEST_API.getCurrentDatabase();

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

QUnit.asyncTest("USE NonExistingDB", function(assert) {
	var sql = "USE NonExistingDB";
	TEST_API.query(sql, function(err, result) {
		QUnit.ok(!!err, "Failed as expected (" + sql + ")");
		QUnit.start();
	});
});
