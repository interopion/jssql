(function() {
	
	function setup()
	{
		QUnit.stop();
		jsSQL(function(API) {
			var sql = [
				"CREATE DATABASE IF NOT EXISTS unitTestingDB",
				"USE unitTestingDB",
				"CREATE TABLE IF NOT EXISTS t1 (a VARCHAR(20) NULL, b VARCHAR(30) NULL)"
			];

			API.query(sql, function(err, reqult, qIdx) {
				if (err)
					QUnit.pushFailure("setup failed: " + err);
				if (qIdx == 2)
					QUnit.start();
			});
		});
	}

	function teardown()
	{
		QUnit.stop();
		jsSQL(function(API) {
			API.query("DROP DATABASE unitTestingDB", function(err) {
				if (err)
					QUnit.pushFailure("teardown failed: " + err);
				QUnit.start();
			});
		});
	}

	module("SHOW COLUMNS", { setup : setup, teardown : teardown });

	function testSQL(sql) 
	{
		QUnit.asyncTest(sql, function(assert) {
			jsSQL(function(API) {
				API.query(sql, function(err, result) {
					assert.ok(!err, err);
					assert.deepEqual(result.rows, [
						["a", "VARCHAR(20)", "YES", undefined, 'none', ''],
						["b", "VARCHAR(30)", "YES", undefined, 'none', '']
					]);
					QUnit.start();
				});
			});
		});
	}
	
	testSQL("SHOW COLUMNS FROM t1 IN unitTestingDB");
	testSQL("SHOW COLUMNS FROM t1 IN 'unitTestingDB'");
	testSQL("SHOW COLUMNS FROM t1 IN `unitTestingDB`");
	testSQL("SHOW COLUMNS FROM t1 IN \"unitTestingDB\"");
	testSQL("SHOW COLUMNS FROM t1 FROM unitTestingDB");
	testSQL("SHOW COLUMNS FROM t1 FROM 'unitTestingDB'");
	testSQL("SHOW COLUMNS FROM t1 FROM `unitTestingDB`");
	testSQL("SHOW COLUMNS FROM t1 FROM \"unitTestingDB\"");
	testSQL("SHOW COLUMNS IN t1 IN unitTestingDB");
	testSQL("SHOW COLUMNS IN `t1` IN 'unitTestingDB'");
	testSQL("SHOW COLUMNS IN 't1' IN `unitTestingDB`");
	testSQL("SHOW COLUMNS IN t1 IN \"unitTestingDB\"");
	testSQL("SHOW COLUMNS IN \"t1\" FROM unitTestingDB");
	testSQL("SHOW COLUMNS IN t1 FROM 'unitTestingDB'");
	testSQL("SHOW COLUMNS IN t1 FROM `unitTestingDB`");
	testSQL("SHOW COLUMNS IN t1 FROM \"unitTestingDB\"");
	
})();