(function() {

	module("CREATE_TABLE", {
		setup: function() {
			QUnit.stop();
			jsSQL(function(API) {
				API.query("CREATE DATABASE IF NOT EXISTS unitTestingDB;USE unitTestingDB", function(err, result, idx) {
					if (err) throw err;
					if (idx === 1)
						QUnit.start();
				});
			});
		},
		teardown: function() {
			QUnit.stop();
			jsSQL(function(API) {
				API.query("DROP DATABASE IF EXISTS unitTestingDB;", function(err) {
					if (err) throw err;
					QUnit.start();
				});
			});
		}
	});

	QUnit.asyncTest("CREATE TABLE testtable", function(assert) {
		var sql = "CREATE TABLE testtable;";
		jsSQL(function(API) {
			API.query(sql, function(err) {
				if (err)
					QUnit.pushFailure(String(err || "Failed"), sql);
				else
					assert.ok(API.getTable("testtable"));
				
				QUnit.start();
			});
		});
	});

	QUnit.asyncTest("CREATE TABLE 'testtable'", function(assert) {
		var sql = "CREATE TABLE 'testtable';";
		jsSQL(function(API) {
			API.query(sql, function(err) {
				if (err)
					QUnit.pushFailure(String(err || "Failed"), sql);
				else
					assert.ok(API.getTable("testtable"));
				
				QUnit.start();
			});
		});
	});

	QUnit.asyncTest("CREATE TABLE `testtable`", function(assert) {
		var sql = "CREATE TABLE `testtable`;";
		jsSQL(function(API) {
			API.query(sql, function(err) {
				if (err)
					QUnit.pushFailure(String(err || "Failed"), sql);
				else
					assert.ok(API.getTable("testtable"));
				
				QUnit.start();
			});
		});
	});

	QUnit.asyncTest("CREATE TABLE \"testtable\"", function(assert) {
		var sql = "CREATE TABLE \"testtable\";";
		jsSQL(function(API) {
			API.query(sql, function(err) {
				if (err)
					QUnit.pushFailure(String(err || "Failed"), sql);
				else
					assert.ok(API.getTable("testtable"));
				
				QUnit.start();
			});
		});
	});

	QUnit.asyncTest(
		"CREATE TABLE must fail if the table exists and IF NOT EXISTS is not used", 
		function(assert) {
			var sql = "CREATE TABLE testtable;CREATE TABLE testtable;";

			expect(0);

			jsSQL(function(API) {
				API.query(sql, function(err, result, idx) {
					if (err) {
						if (idx === 0)
							QUnit.pushFailure(String(err || "Failed"), sql);
					}
					else {
						if (idx === 1)
							QUnit.pushFailure("Didn't fail", sql);
					}

					if (idx === 1)
						QUnit.start();
				});
			});
		}
	);

	QUnit.asyncTest(
		"CREATE TABLE IF NOT EXISTS testtable", 
		function(assert) {
			var sql = "CREATE TABLE testtable;CREATE TABLE IF NOT EXISTS testtable";

			expect(0);

			jsSQL(function(API) {
				API.query(sql, function(err, result, idx) {
					if (idx === 1) {
						if (err)
							QUnit.pushFailure(String(err || "Failed"), sql);

						QUnit.start();
					}
				});
			});
		}
	);

	QUnit.asyncTest(
		"CREATE TABLE testtable (a INT, b VARCHAR)", 
		function(assert) {
			var sql = "CREATE TABLE testtable (a INT, b VARCHAR)";

			jsSQL(function(API) {
				API.query(sql, function(err, result, idx) {
					if (err) {
						QUnit.pushFailure(String(err || "Failed"), sql);
					} else {
						var table = API.getTable("testtable");
						assert.ok(table);
						assert.ok(table.cols.a);
						assert.ok(table.cols.b);
						assert.equal(table.cols.a.type, "INT");
						assert.equal(table.cols.b.type, "VARCHAR");
						assert.deepEqual(table.keys, {});
					}

					QUnit.start();
				});
			});
		}
	);

	QUnit.asyncTest(
		"CREATE TABLE testtable (a INT, b VARCHAR, PRIMARY KEY (a))", 
		function(assert) {
			var sql = "CREATE TABLE testtable (a INT, b VARCHAR, PRIMARY KEY (a))";

			jsSQL(function(API) {
				API.query(sql, function(err, result, idx) {
					if (err) {
						QUnit.pushFailure(String(err || "Failed"), sql);
					} else {
						var table = API.getTable("testtable");
						assert.ok(table);
						assert.ok(table.cols.a);
						assert.ok(table.cols.b);
						assert.ok(table.keys.a);
						assert.ok(table.keys.a.type, JSDB.TableIndex.TYPE_PRIMARY);
					}

					QUnit.start();
				});
			});
		}
	);

})();
