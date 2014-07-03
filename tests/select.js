(function() {

	module("SELECT");

	var testQueue = (function() {
		var tests = [];

		function add(name, test) {
			tests.push(function(done, fail) {
				QUnit.asyncTest(name, function(assert) {
					test(done, fail)
				});
			});
		}

		function done() {
			QUnit.start();
			run();
		}

		function fail(message, actual) {
			QUnit.pushFailure(message || "Failed", actual);
			QUnit.start();
		}

		function run() {
			if (tests.length) {
				tests.shift()(done, fail);
			}
		}

		return {
			add : add,
			run : run
		};

	})();

	testQueue.add("CrossJoin", function(done, fail) {
		var t1 = [
				{ a : "a1", b : "b1" },
				{ a : "a2", b : "b2" },
				{ a : "a3", b : "b3" }
			],
			t2 = [
				{ c : "c1", d : "d1" },
				{ e : "c2", f : "d2" }	
			];

		deepEqual(JSDB.crossJoin2([t1, t2]), [
			{ a : "a1", b : "b1", c : "c1", d : "d1" },
			{ a : "a1", b : "b1", e : "c2", f : "d2" },
			{ a : "a2", b : "b2", c : "c1", d : "d1" },
			{ a : "a2", b : "b2", e : "c2", f : "d2" },
			{ a : "a3", b : "b3", c : "c1", d : "d1" },
			{ a : "a3", b : "b3", e : "c2", f : "d2" }
		]);
		done();
	});

	testQueue.add("Waiting for the srver to load", function(done, fail) {
		expect(0);
		if (!JSDB.SERVER.loaded) {
			JSDB.events.bind("load:server", done);
		} else {
			done();
		}
	});

	testQueue.add("Create test database", function(done, fail) {
		var sql = "CREATE DATABASE IF NOT EXISTS unitTestingDB;";
		JSDB.query(
			sql, 
			function() {
				ok(!!JSDB.SERVER.databases.unitTestingDB);
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("Use test database", function(done, fail) {
		var sql = "USE unitTestingDB;";
		JSDB.query(
			sql, 
			function(msg) {
				var db = JSDB.SERVER.getCurrentDatabase();
				equal(msg, 'Database "unitTestingDB" selected.');
				ok(db && db.name == "unitTestingDB");
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("Create table t1", function(done, fail) {
		QUnit.expect(0);
		var sql = "CREATE TABLE IF NOT EXISTS t1 (a VARCHAR(20) NULL, b VARCHAR(20) NULL);";
		JSDB.query(
			sql, 
			function() {
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("Create table t2", function(done, fail) {
		QUnit.expect(0);
		var sql = "CREATE TABLE IF NOT EXISTS t2 (c VARCHAR(20) NULL, d VARCHAR(20) NULL);";
		JSDB.query(
			sql, 
			function() {
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("Insert values into t1", function(done, fail) {
		expect(0);
		var sql = "INSERT INTO t1(a, b) VALUES " + 
			"('a1', 'b1')," + 
			"('a2', 'b2')," + 
			"('a3', 'b3');";
		JSDB.query(
			sql, 
			function() {
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("Insert values into t2", function(done, fail) {
		expect(0);
		var sql = "INSERT INTO t2(c, d) VALUES " + 
			"('c1', 'd1')," + 
			"('c2', 'd2');";
		JSDB.query(sql, done, function(error) {
			fail(error.message, sql);
		});
	});

	testQueue.add("SELECT (2 + 2);", function(done, fail) {
		expect(1);
		var sql = 'SELECT (2 + 2);';
		JSDB.query(
			sql, 
			function(result) {
				deepEqual(result, {
					cols : ["(2 + 2)"],
					rows : [
						{ "(2 + 2)" : 4 }
					]
				});
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("Assert that the table can be specified as single name", function(done, fail) {
		expect(0);
		var sql = "select a from t1;";
		JSDB.query(
			sql, 
			done, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("Assert that the table can be specified as {DB}.{tablename}", function(done, fail) {
		expect(0);
		var sql = "select a from unitTestingDB.t1;";
		JSDB.query(sql, done, function(error) {
			fail(error.message, sql);
		});
	});

	testQueue.add("Assert that the table can be specified as {\"DB\"}.{\"tablename\"}", function(done, fail) {
		expect(0);
		var sql = 'select a from "unitTestingDB"."t1";';
		JSDB.query(sql, done, function(error) {
			fail(error.message, sql);
		});
	});

	testQueue.add("Assert that individual table columns can be selected", function(done, fail) {
		expect(1);
		var sql = 'select a from t1;';
		JSDB.query(
			sql, 
			function(result) {
				deepEqual(result, {
					cols : ["a"],
					rows : [
						{ a : 'a1' },
						{ a : 'a2' },
						{ a : 'a3' }
					]
				});
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("Assert that individual table columns can be selected", function(done, fail) {
		expect(1);
		var sql = 'select b from t1;';
		JSDB.query(
			sql, 
			function(result) {
				deepEqual(result, {
					cols : ["b"],
					rows : [
						{ b : 'b1' },
						{ b : 'b2' },
						{ b : 'b3' }
					]
				});
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("Assert that '*' can be used on a single table", function(done, fail) {
		expect(1);
		var sql = 'select * from t1;';
		JSDB.query(
			sql, 
			function(result) {
				deepEqual(result, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a1', b : 'b1' },
						{ a : 'a2', b : 'b2' },
						{ a : 'a3', b : 'b3' }
					]
				});
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("Assert that '*' can be used on a multiple tables", function(done, fail) {
		expect(2);
		var sql = 'select * from t1, t2;';
		JSDB.query(
			sql, 
			function(result) {
				deepEqual(result.cols, ["a", "b", "c", "d"]);
				deepEqual(result.rows, [
					{ a : 'a1', b : 'b1', c : "c1", d : "d1" },
					{ a : 'a1', b : 'b1', c : "c2", d : "d2" },
					{ a : 'a2', b : 'b2', c : "c1", d : "d1" },
					{ a : 'a2', b : 'b2', c : "c2", d : "d2" },
					{ a : 'a3', b : 'b3', c : "c1", d : "d1" },
					{ a : 'a3', b : 'b3', c : "c2", d : "d2" }
				]);
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("LIMIT 2 OFFSET 1", function(done, fail) {
		expect(1);
		var sql = 'select * from t1 LIMIT 2 OFFSET 1;';
		JSDB.query(
			sql, 
			function(result) {
				deepEqual(result, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a2', b : 'b2' },
						{ a : 'a3', b : 'b3' }
					]
				});
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("LIMIT 2", function(done, fail) {
		expect(1);
		var sql = 'select * from t1 LIMIT 2;';
		JSDB.query(
			sql, 
			function(result) {
				deepEqual(result, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a1', b : 'b1' },
						{ a : 'a2', b : 'b2' }
					]
				});
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("LIMIT 1, 2", function(done, fail) {
		expect(1);
		var sql = 'select * from t1 LIMIT 1, 2;';
		JSDB.query(
			sql, 
			function(result) {
				deepEqual(result, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a3', b : 'b3' }
					]
				});
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("LIMIT 1, 2 OFFSET 1", function(done, fail) {
		expect(1);
		var sql = 'select * from t1 LIMIT 1, 2 OFFSET 1;';
		JSDB.query(
			sql, 
			function(result) {
				deepEqual(result, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a2', b : 'b2' }
					]
				});
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("SELECT * FROM t1 ORDER BY a;", function(done, fail) {
		expect(1);
		var sql = 'SELECT * FROM t1 ORDER BY a;';
		JSDB.query(
			sql, 
			function(result) {
				deepEqual(result, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a1', b : 'b1' },
						{ a : 'a2', b : 'b2' },
						{ a : 'a3', b : 'b3' }
					]
				});
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("SELECT * FROM t1 ORDER BY a ASC;", function(done, fail) {
		expect(1);
		var sql = 'SELECT * FROM t1 ORDER BY a ASC;';
		JSDB.query(
			sql, 
			function(result) {
				deepEqual(result, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a1', b : 'b1' },
						{ a : 'a2', b : 'b2' },
						{ a : 'a3', b : 'b3' }
					]
				});
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("SELECT * FROM t1 ORDER BY a DESC;", function(done, fail) {
		expect(1);
		var sql = 'SELECT * FROM t1 ORDER BY a DESC;';
		JSDB.query(
			sql, 
			function(result) {
				deepEqual(result, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a3', b : 'b3' },
						{ a : 'a2', b : 'b2' },
						{ a : 'a1', b : 'b1' }
					]
				});
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("SELECT * FROM t1 ORDER BY b DESC;", function(done, fail) {
		expect(1);
		var sql = 'SELECT * FROM t1 ORDER BY b DESC;';
		JSDB.query(
			sql, 
			function(result) {
				deepEqual(result, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a3', b : 'b3' },
						{ a : 'a2', b : 'b2' },
						{ a : 'a1', b : 'b1' }
					]
				});
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("Mix an expression with regular columns", function(done, fail) {
		expect(1);
		var sql = 'select t1.*, (a + b + (2 + 3)) as sum from t1;';
		JSDB.query(
			sql, 
			function(result) {
				deepEqual(result, {
					cols : ["a", "b", "sum"],
					rows : [
						{ a : 'a1', b : 'b1', sum : 'a1b15' },
						{ a : 'a2', b : 'b2', sum : 'a2b25' },
						{ a : 'a3', b : 'b3', sum : 'a3b35' }
					]
				});
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("SELECT * FROM t1 WHERE a = a2", function(done, fail) {
		expect(1);
		var sql = "SELECT * FROM t1 WHERE a = 'a2';";
		JSDB.query(
			sql, 
			function(result) {
				deepEqual(result, {
					cols : ["a", "b"],
					rows : [
						{ a : 'a2', b : 'b2' }
					]
				});
				done();
			}, 
			function(error) {
				fail(error.message, sql);
			}
		);
	});

	testQueue.add("Drop test database", function(done, fail) {
		expect(0);
		var sql = "DROP DATABASE unitTestingDB;";
		JSDB.query(sql, done, function(error) {
			fail(error.message, sql);
		});
	});

	testQueue.run();

	

})();