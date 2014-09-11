(function() {
	
	function setup()
	{
		QUnit.stop();
		var sql = [
			"CREATE DATABASE IF NOT EXISTS unitTestingDB",
			"USE unitTestingDB",
			"CREATE TABLE IF NOT EXISTS t1 (a VARCHAR(20) NULL, b VARCHAR(30) NULL)",
			"CREATE TABLE IF NOT EXISTS t2 (c VARCHAR(40) NULL, c VARCHAR(50) NULL)"
		];

		TEST_API.query(sql, function(err, reqult, qIdx) {
			if (err)
				QUnit.pushFailure("setup failed: " + err);
			if (qIdx == 3)
				QUnit.start();
		});
	}

	function teardown()
	{
		QUnit.stop();
		TEST_API.query("DROP DATABASE IF EXISTS unitTestingDB", function(err) {
			if (err)
				QUnit.pushFailure("teardown failed: " + err);
			else
				QUnit.start();
		});
	}

	module("SHOW TABLES", { setup : setup, teardown : teardown });

	function testSQL(sql) {
		QUnit.asyncTest(sql, function(assert) {
			TEST_API.query(sql, function(err, result) {
				assert.ok(!err, err);
				assert.deepEqual(result.rows, [["t1"], ["t2"]]);
				QUnit.start();
			});
		});
	}
	
	testSQL("SHOW TABLES IN unitTestingDB");
	testSQL("SHOW TABLES IN 'unitTestingDB'");
	testSQL("SHOW TABLES IN `unitTestingDB`");
	testSQL("SHOW TABLES IN \"unitTestingDB\"");
	testSQL("SHOW TABLES FROM unitTestingDB");
	testSQL("SHOW TABLES FROM 'unitTestingDB'");
	testSQL("SHOW TABLES FROM `unitTestingDB`");
	testSQL("SHOW TABLES FROM \"unitTestingDB\"");
	
})();