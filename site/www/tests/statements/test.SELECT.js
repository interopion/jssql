
module("SELECT", { 
	setup : function() {
		QUnit.stop();
		var sql = [
			"CREATE DATABASE IF NOT EXISTS unitTestingDB",
			"USE unitTestingDB",
			"CREATE TABLE IF NOT EXISTS t1 (a VARCHAR(20) NULL, b VARCHAR(20) NULL)",
			"CREATE TABLE IF NOT EXISTS t2 (c VARCHAR(20) NULL, d VARCHAR(20) NULL)",
			"INSERT INTO t1(a, b) VALUES ('a1', 'b1'),('a2', 'b2'),('a3', 'b3')",
			"INSERT INTO t2(c, d) VALUES ('c1', 'd1'),('c2', 'd2')"
		];

		TEST_API.query(sql, function(err, reqult, qIdx) {
			if (err) 
				QUnit.pushFailure("setup failed: " + err);
			if (qIdx == 5)
				QUnit.start();
		});
	},
	teardown : function() {
		QUnit.stop();
		TEST_API.query("DROP DATABASE IF EXISTS unitTestingDB", function(err) {
			if (err)
				QUnit.pushFailure("teardown failed: " + err);
			QUnit.start();
		});
	}
});


QUnit.asyncTest("SELECT (2 + 2);", function(assert) {
	TEST_API.query('SELECT (2 + 2)', function(err, result) {
		assert.ok(!err, err);
		assert.deepEqual(result.data, {
			cols : ["(2 + 2)"],
			rows : [{ "(2 + 2)" : 4 }]
		});
		QUnit.start();
	});
});

QUnit.asyncTest("Assert that the table can be specified as single name", function(assert) {
	TEST_API.query('select a from t1', function(err, result) {
		assert.ok(!err, err); 
		QUnit.start();
	});
});

QUnit.asyncTest("Assert that the table can be specified as {DB}.{tablename}", function(assert) {
	TEST_API.query('select a from unitTestingDB.t1', function(err, result) {
		assert.ok(!err, err); 
		QUnit.start();
	});
});

QUnit.asyncTest("Assert that the table can be specified as {DB}.{tablename}", function(assert) {
	TEST_API.query('select a from unitTestingDB.t1', function(err, result) {
		assert.ok(!err, err); 
		QUnit.start();
	});
});

QUnit.asyncTest("Assert that the table can be specified as {\"DB\"}.{\"tablename\"}", function(assert) {
	TEST_API.query('select a from "unitTestingDB"."t1";', function(err, result) {
		assert.ok(!err, err); 
		QUnit.start();
	});
});

QUnit.asyncTest("Assert that individual table columns can be selected", function(assert) {
	TEST_API.query('select a from t1', function(err, result) {
		assert.ok(!err, err);
		assert.deepEqual(result.data, {
			cols : ["a"],
			rows : [
				{ a : 'a1' },
				{ a : 'a2' },
				{ a : 'a3' }
			]
		});
		QUnit.start();
	});
});

QUnit.asyncTest("Assert that individual table columns can be selected", function(assert) {
	TEST_API.query('select b from t1', function(err, result) {
		assert.ok(!err, err);
		assert.deepEqual(result.data, {
			cols : ["b"],
			rows : [
				{ b : 'b1' },
				{ b : 'b2' },
				{ b : 'b3' }
			]
		});
		QUnit.start();
	});
});

QUnit.asyncTest("Assert that '*' can be used on a single table", function(assert) {
	TEST_API.query('select * from t1', function(err, result) {
		assert.ok(!err, err);
		assert.deepEqual(result.data, {
			cols : ["a", "b"],
			rows : [
				{ a : 'a1', b : 'b1' },
				{ a : 'a2', b : 'b2' },
				{ a : 'a3', b : 'b3' }
			]
		});
		QUnit.start();
	});
});

QUnit.asyncTest("Assert that '*' can be used on multiple tables", function(assert) {
	TEST_API.query('select * from t1, t2', function(err, result) {
		assert.ok(!err, err);
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
	});
});

QUnit.asyncTest("LIMIT 2 OFFSET 1", function(assert) {
	TEST_API.query('select * from t1 LIMIT 2 OFFSET 1;', function(err, result) {
		assert.ok(!err, err);
		assert.deepEqual(result.data, {
			cols : ["a", "b"],
			rows : [
				{ a : 'a2', b : 'b2' },
				{ a : 'a3', b : 'b3' }
			]
		});
		QUnit.start();
	});
});

QUnit.asyncTest("LIMIT 2", function(assert) {
	TEST_API.query('select * from t1 LIMIT 2', function(err, result) {
		assert.ok(!err, err);
		assert.deepEqual(result.data, {
			cols : ["a", "b"],
			rows : [
				{ a : 'a1', b : 'b1' },
				{ a : 'a2', b : 'b2' }
			]
		});
		QUnit.start();
	});
});

QUnit.asyncTest("LIMIT 1, 2", function(assert) {
	TEST_API.query('select * from t1 LIMIT 1, 2', function(err, result) {
		assert.ok(!err, err);
		assert.deepEqual(result.data, {
			cols : ["a", "b"],
			rows : [
				{ a : 'a3', b : 'b3' }
			]
		});
		QUnit.start();
	});
});

QUnit.asyncTest("LIMIT 1, 2 OFFSET 1", function(assert) {
	TEST_API.query('select * from t1 LIMIT 1, 2 OFFSET 1', function(err, result) {
		assert.ok(!err, err);
		assert.deepEqual(result.data, {
			cols : ["a", "b"],
			rows : [
				{ a : 'a2', b : 'b2' }
			]
		});
		QUnit.start();
	});
});

QUnit.asyncTest("SELECT * FROM t1 ORDER BY a", function(assert) {
	TEST_API.query('SELECT * FROM t1 ORDER BY a', function(err, result) {
		assert.ok(!err, err);
		assert.deepEqual(result.data, {
			cols : ["a", "b"],
			rows : [
				{ a : 'a1', b : 'b1' },
				{ a : 'a2', b : 'b2' },
				{ a : 'a3', b : 'b3' }
			]
		});
		QUnit.start();
	});
});

QUnit.asyncTest("SELECT * FROM t1 ORDER BY a ASC", function(assert) {
	TEST_API.query('SELECT * FROM t1 ORDER BY a ASC', function(err, result) {
		assert.ok(!err, err);
		assert.deepEqual(result.data, {
			cols : ["a", "b"],
			rows : [
				{ a : 'a1', b : 'b1' },
				{ a : 'a2', b : 'b2' },
				{ a : 'a3', b : 'b3' }
			]
		});
		QUnit.start();
	});
});

QUnit.asyncTest("SELECT * FROM t1 ORDER BY a DESC", function(assert) {
	TEST_API.query('SELECT * FROM t1 ORDER BY a DESC', function(err, result) {
		assert.ok(!err, err);
		assert.deepEqual(result.data, {
			cols : ["a", "b"],
			rows : [
				{ a : 'a3', b : 'b3' },
				{ a : 'a2', b : 'b2' },
				{ a : 'a1', b : 'b1' }
			]
		});
		QUnit.start();
	});
});

QUnit.asyncTest("SELECT * FROM t1 ORDER BY b DESC", function(assert) {
	TEST_API.query('SELECT * FROM t1 ORDER BY b DESC', function(err, result) {
		assert.ok(!err, err);
		assert.deepEqual(result.data, {
			cols : ["a", "b"],
			rows : [
				{ a : 'a3', b : 'b3' },
				{ a : 'a2', b : 'b2' },
				{ a : 'a1', b : 'b1' }
			]
		});
		QUnit.start();
	});
});

QUnit.asyncTest("Mix an expression with regular columns", function(assert) {
	TEST_API.query('select t1.*, (a + b + (2 + 3)) as sum from t1', function(err, result) {
		assert.ok(!err, err);
		assert.deepEqual(result.data, {
			cols : ["a", "b", "sum"],
			rows : [
				{ a : 'a1', b : 'b1', sum : 'a1b15' },
				{ a : 'a2', b : 'b2', sum : 'a2b25' },
				{ a : 'a3', b : 'b3', sum : 'a3b35' }
			]
		});
		QUnit.start();
	});
});

QUnit.asyncTest("Various xpressions", function(assert) {
	TEST_API.query('select (a + b + (2 + 3)) as sum, (Math.PI * 1) from t1', function(err, result) {
		assert.ok(!err, err);
		assert.deepEqual(result.data, {
			cols : ["sum", "(Math.PI * 1)"],
			rows : [
				{ sum : 'a1b15', "(Math.PI * 1)" : Math.PI },
				{ sum : 'a2b25', "(Math.PI * 1)" : Math.PI },
				{ sum : 'a3b35', "(Math.PI * 1)" : Math.PI }
			]
		});
		QUnit.start();
	});
});

QUnit.asyncTest("SELECT * FROM t1 WHERE a = 'a2'", function(assert) {
	TEST_API.query("SELECT * FROM t1 WHERE a = 'a2'", function(err, result) {
		assert.ok(!err, err);
		assert.deepEqual(result.data, {
			cols : ["a", "b"],
			rows : [
				{ a : 'a2', b : 'b2' }
			]
		});
		QUnit.start();
	});
});

QUnit.asyncTest("Select where applied after limit", function(assert) {
	TEST_API.query("SELECT * FROM t1 WHERE a = 'a2' LIMIT 1", function(err, result) {
		assert.ok(!err, err);
		assert.deepEqual(result.data, {
			cols : ["a", "b"],
			rows : [
				{ a : 'a2', b : 'b2' }
			]
		});
		QUnit.start();
	});
});

QUnit.asyncTest("CrossJoin", function(assert) {
	TEST_API.query("SELECT * FROM t1, t2", function(err, result) {
		assert.ok(!err, err);
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
	});
});
