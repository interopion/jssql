(function() {
	
	function onError(error) {
		console.error(error);
		//QUnit.pushFailure(error.message || "Failed", sql);
		//QUnit.start();
	}

	function connect(onComplete)
	{
		if (!JSDB.SERVER.loaded) {
			JSDB.events.one("load:server", onComplete, onError);
		} else {
			onComplete();
		}
	}

	function createDB(onComplete)
	{
		JSDB.query("CREATE DATABASE IF NOT EXISTS unitTestingDB;", onComplete, onError);
	}

	function selectDB(onComplete)
	{
		JSDB.query("USE unitTestingDB;", onComplete, onError);
	}

	function createTables(onComplete)
	{
		var sql = "CREATE TABLE IF NOT EXISTS t1 (a VARCHAR(20) NULL, b VARCHAR(20) NULL);";
		JSDB.query(sql, function() {
			sql = "CREATE TABLE IF NOT EXISTS t2 (c VARCHAR(20) NULL, d VARCHAR(20) NULL);";
			JSDB.query(sql, onComplete, onError);
		}, onError);
	}

	function insertData(onComplete)
	{
		var sql = "INSERT INTO t1(a, b) VALUES " + 
			"('a1', 'b1')," + 
			"('a2', 'b2')," + 
			"('a3', 'b3');";
		JSDB.query(
			sql, 
			function() {
				sql = "INSERT INTO t2(c, d) VALUES " + 
					"('c1', 'd1')," + 
					"('c2', 'd2');";
				JSDB.query(sql, onComplete, onError);
			}, 
			onError
		);
	}

	function init(onComplete)
	{
		connect(function() {
			createDB(function() {
				selectDB(function() {
					createTables(function() {
						insertData(onComplete);
					});
				});
			});
		});
	}

	function setup()
	{
		QUnit.stop();
		init(function() {
			QUnit.start();
		});
	}

	function teardown()
	{
		QUnit.stop();
		var sql = "DROP DATABASE unitTestingDB;";
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
	}

	module("SELECT", { setup : setup, teardown : teardown });

	
	QUnit.asyncTest("SELECT (2 + 2);", function(assert) {
		expect(1);
		var sql = 'SELECT (2 + 2);';
		JSDB.query(
			sql, 
			function(result) {
				assert.deepEqual(result.data, {
					cols : ["(2 + 2)"],
					rows : [
						{ "(2 + 2)" : 4 }
					]
				});
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();	
			}
		);
	});

	QUnit.asyncTest("Assert that the table can be specified as single name", function(assert) {
		expect(0);
		var sql = "select a from t1;";
		JSDB.query(
			sql, 
			function() {
				if (QUnit.config.semaphore) 
					QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				if (QUnit.config.semaphore) 
					QUnit.start();
			}
		);
	});
	
	QUnit.asyncTest("Assert that the table can be specified as {DB}.{tablename}", function(assert) {
		expect(0);
		var sql = "select a from unitTestingDB.t1;";
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

	QUnit.asyncTest("Assert that the table can be specified as {\"DB\"}.{\"tablename\"}", function(assert) {
		expect(0);
		var sql = 'select a from "unitTestingDB"."t1";';
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

	QUnit.asyncTest("Assert that individual table columns can be selected", function(assert) {
		expect(1);
		var sql = 'select a from t1;';
		JSDB.query(
			sql, 
			function(result) {
				assert.deepEqual(result.data, {
					cols : ["a"],
					rows : [
						{ a : 'a1' },
						{ a : 'a2' },
						{ a : 'a3' }
					]
				});
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	QUnit.asyncTest("Assert that individual table columns can be selected", function(assert) {
		expect(1);
		var sql = 'select b from t1;';
		JSDB.query(
			sql, 
			function(result) {
				assert.deepEqual(result.data, {
					cols : ["b"],
					rows : [
						{ b : 'b1' },
						{ b : 'b2' },
						{ b : 'b3' }
					]
				});
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	QUnit.asyncTest("Assert that '*' can be used on a single table", function(assert) {
		expect(1);
		var sql = 'select * from t1;';
		JSDB.query(
			sql, 
			function(result) {
				assert.deepEqual(result.data, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a1', b : 'b1' },
						{ a : 'a2', b : 'b2' },
						{ a : 'a3', b : 'b3' }
					]
				});
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	QUnit.asyncTest("Assert that '*' can be used on a multiple tables", function(assert) {
		expect(2);
		var sql = 'select * from t1, t2;';
		JSDB.query(
			sql, 
			function(result) {
				assert.deepEqual(result.cols, ["a", "b", "c", "d"]);
				assert.deepEqual(result.rows, [
					{ a : 'a1', b : 'b1', c : "c1", d : "d1" },
					{ a : 'a1', b : 'b1', c : "c2", d : "d2" },
					{ a : 'a2', b : 'b2', c : "c1", d : "d1" },
					{ a : 'a2', b : 'b2', c : "c2", d : "d2" },
					{ a : 'a3', b : 'b3', c : "c1", d : "d1" },
					{ a : 'a3', b : 'b3', c : "c2", d : "d2" }
				]);
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	QUnit.asyncTest("LIMIT 2 OFFSET 1", function(assert) {
		expect(1);
		var sql = 'select * from t1 LIMIT 2 OFFSET 1;';
		JSDB.query(
			sql, 
			function(result) {
				assert.deepEqual(result.data, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a2', b : 'b2' },
						{ a : 'a3', b : 'b3' }
					]
				});
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	QUnit.asyncTest("LIMIT 2", function(assert) {
		expect(1);
		var sql = 'select * from t1 LIMIT 2;';
		JSDB.query(
			sql, 
			function(result) {
				assert.deepEqual(result.data, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a1', b : 'b1' },
						{ a : 'a2', b : 'b2' }
					]
				});
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	QUnit.asyncTest("LIMIT 1, 2", function(assert) {
		expect(1);
		var sql = 'select * from t1 LIMIT 1, 2;';
		JSDB.query(
			sql, 
			function(result) {
				assert.deepEqual(result.data, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a3', b : 'b3' }
					]
				});
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});
		
	QUnit.asyncTest("LIMIT 1, 2 OFFSET 1", function(assert) {
		expect(1);
		var sql = 'select * from t1 LIMIT 1, 2 OFFSET 1;';
		JSDB.query(
			sql, 
			function(result) {
				assert.deepEqual(result.data, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a2', b : 'b2' }
					]
				});
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	QUnit.asyncTest("SELECT * FROM t1 ORDER BY a;", function(assert) {
		expect(1);
		var sql = 'SELECT * FROM t1 ORDER BY a;';
		JSDB.query(
			sql, 
			function(result) {
				assert.deepEqual(result.data, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a1', b : 'b1' },
						{ a : 'a2', b : 'b2' },
						{ a : 'a3', b : 'b3' }
					]
				});
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	QUnit.asyncTest("SELECT * FROM t1 ORDER BY a ASC;", function(assert) {
		expect(1);
		var sql = 'SELECT * FROM t1 ORDER BY a ASC;';
		JSDB.query(
			sql, 
			function(result) {
				assert.deepEqual(result.data, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a1', b : 'b1' },
						{ a : 'a2', b : 'b2' },
						{ a : 'a3', b : 'b3' }
					]
				});
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});
	
	QUnit.asyncTest("SELECT * FROM t1 ORDER BY a DESC;", function(assert) {
		expect(1);
		var sql = 'SELECT * FROM t1 ORDER BY a DESC;';
		JSDB.query(
			sql, 
			function(result) {
				assert.deepEqual(result.data, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a3', b : 'b3' },
						{ a : 'a2', b : 'b2' },
						{ a : 'a1', b : 'b1' }
					]
				});
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	QUnit.asyncTest("SELECT * FROM t1 ORDER BY b DESC;", function(assert) {
		expect(1);
		var sql = 'SELECT * FROM t1 ORDER BY b DESC;';
		JSDB.query(
			sql, 
			function(result) {
				assert.deepEqual(result.data, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a3', b : 'b3' },
						{ a : 'a2', b : 'b2' },
						{ a : 'a1', b : 'b1' }
					]
				});
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	QUnit.asyncTest("Mix an expression with regular columns", function(assert) {
		expect(1);
		var sql = 'select t1.*, (a + b + (2 + 3)) as sum from t1;';
		JSDB.query(
			sql, 
			function(result) {
				assert.deepEqual(result.data, {
					cols : ["a", "b", "sum"],
					rows : [
						{ a : 'a1', b : 'b1', sum : 'a1b15' },
						{ a : 'a2', b : 'b2', sum : 'a2b25' },
						{ a : 'a3', b : 'b3', sum : 'a3b35' }
					]
				});
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	QUnit.asyncTest("Various xpressions", function(assert) {
		expect(1);
		var sql = 'select (a + b + (2 + 3)) as sum, (Math.PI * 1) from t1;';
		JSDB.query(
			sql, 
			function(result) {
				assert.deepEqual(result.data, {
					cols : ["sum", "(Math.PI * 1)"],
					rows : [
						{ sum : 'a1b15', "(Math.PI * 1)" : Math.PI },
						{ sum : 'a2b25', "(Math.PI * 1)" : Math.PI },
						{ sum : 'a3b35', "(Math.PI * 1)" : Math.PI }
					]
				});
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	QUnit.asyncTest("SELECT * FROM t1 WHERE a = a2", function(assert) {
		expect(1);
		var sql = "SELECT * FROM t1 WHERE a = 'a2';";
		JSDB.query(
			sql, 
			function(result) {
				assert.deepEqual(result.data, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a2', b : 'b2' }
					]
				});
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});
	
	QUnit.test("CrossJoin", function(assert) {
		var t1 = [
				{ a : "a1", b : "b1" },
				{ a : "a2", b : "b2" },
				{ a : "a3", b : "b3" }
			],
			t2 = [
				{ c : "c1", d : "d1" },
				{ e : "c2", f : "d2" }	
			];

		assert.deepEqual(JSDB.crossJoin2([t1, t2]), [
			{ a : "a1", b : "b1", c : "c1", d : "d1" },
			{ a : "a1", b : "b1", e : "c2", f : "d2" },
			{ a : "a2", b : "b2", c : "c1", d : "d1" },
			{ a : "a2", b : "b2", e : "c2", f : "d2" },
			{ a : "a3", b : "b3", c : "c1", d : "d1" },
			{ a : "a3", b : "b3", e : "c2", f : "d2" }
		]);
	});
})();