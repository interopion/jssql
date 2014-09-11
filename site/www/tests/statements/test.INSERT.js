	
module("INSERT", { 
	setup : function() {
		QUnit.stop();
		var sql = [
			"CREATE DATABASE IF NOT EXISTS unitTestingDB",
			"USE unitTestingDB",
			"CREATE TABLE IF NOT EXISTS t1 (a VARCHAR(20) NULL, b VARCHAR(20) NULL)"
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

QUnit.asyncTest("INSERT INTO t1(a, b) VALUES ('a1', 'b1'),('a2', 'b2'),('a3', 'b3')", function(assert) {
	TEST_API.query("INSERT INTO t1(a, b) VALUES ('a1', 'b1'),('a2', 'b2'),('a3', 'b3')", function(err, result) {
		var table = TEST_API.getTable("t1");
		assert.ok(!err);
		assert.strictEqual(table._length, 3);
		assert.strictEqual(table._ai, 4);
		assert.deepEqual(table._row_seq, [1, 2, 3]);
		assert.deepEqual(table.rows["1"]._data, ['a1', 'b1']);
		assert.deepEqual(table.rows["2"]._data, ['a2', 'b2']);
		assert.deepEqual(table.rows["3"]._data, ['a3', 'b3']);
		QUnit.start();
	});
});

QUnit.asyncTest("INSERT INTO t1(a, b) VALUES ('a1', 'b1'),('a2', 'b2'),('a3', 'b3')", function(assert) {
	TEST_API.query([
		"INSERT INTO t1(a, b) VALUES ('a1', 'b1'),('a2', 'b2'),('a3', 'b3')",
		"INSERT INTO t1(a, b) VALUES ('a1', 'b1'),('a2', 'b2'),('a3', 'b3')"
		], function(err, result, qIdx) {
			assert.ok(!err);
			if (qIdx === 1) {
				var table = TEST_API.getTable("t1");
				assert.strictEqual(table._length, 6);
				assert.strictEqual(table._ai, 7);
				assert.deepEqual(table._row_seq, [1, 2, 3, 4, 5, 6]);
				assert.deepEqual(table.rows["4"]._data, ['a1', 'b1']);
				assert.deepEqual(table.rows["5"]._data, ['a2', 'b2']);
				assert.deepEqual(table.rows["6"]._data, ['a3', 'b3']);
				QUnit.start();
			}
		}
	);
});

QUnit.asyncTest("INSERT INTO t1(a, b) VALUES ('a1', 'b1'),('a2', 'b2'),('a3', 'b3')", function(assert) {
	TEST_API.query("INSERT INTO t1(a, b) VALUES ('a1', 'b1'),('a2', 'b2'),('a3', 'b3')", function(err, result) {
		assert.ok(!err); 
		QUnit.start();
	});
});