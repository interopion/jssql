(function() {
	
	module("SHOW COLUMNS", { 
		setup : function setup() {
			QUnit.stop();
			var sql = [
				"CREATE DATABASE IF NOT EXISTS unitTestingDB",
				"USE unitTestingDB",
				"CREATE TABLE IF NOT EXISTS t1 (a VARCHAR(20) NULL, b VARCHAR(30) NULL)"
			];

			TEST_API.query(sql, function(err, reqult, qIdx) {
				if (err)
					QUnit.pushFailure("setup failed: " + err);
				if (qIdx == 2)
					QUnit.start();
			});
		},
		teardown : function() {
			QUnit.stop();
			TEST_API.query("DROP DATABASE unitTestingDB", function(err) {
				if (err)
					QUnit.pushFailure("teardown failed: " + err);
				QUnit.start();
			});
		}
	});

	function testSQL(sql) 
	{
		QUnit.asyncTest(sql, function(assert) {
			TEST_API.query(sql, function(err, result) {
				assert.ok(!err, err);
				assert.deepEqual(result.rows, [
					["a", "VARCHAR(20)", "YES", undefined, 'none', ''],
					["b", "VARCHAR(30)", "YES", undefined, 'none', '']
				]);
				QUnit.start();
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