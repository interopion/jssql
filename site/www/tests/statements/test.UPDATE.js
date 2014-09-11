
module("UPDATE", { 
	setup : function() {
		QUnit.stop();
		var sql = [
			"CREATE DATABASE IF NOT EXISTS unitTestingDB",
			"USE unitTestingDB",
			'CREATE TABLE IF NOT EXISTS t1 (' + 
				'id  INT(2) NULL, ' + 
				'val VARCHAR(20) NULL,' + 
				'PRIMARY KEY (id),' +
				'KEY value_index (val)' + 
			')',
			"INSERT INTO t1(id, val) VALUES (1, 'a'), (2, 'b'), (3, 'c')"
		];

		TEST_API.query(sql, function(err, reqult, qIdx) {
			if (err) 
				QUnit.pushFailure("setup failed: " + err);
			if (qIdx == 3)
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

// Simple UPDATE that runs on all of the rows
QUnit.asyncTest("UPDATE t1 SET val = 'updated'", function(assert) {
	TEST_API.query("UPDATE t1 SET val = 'updated'", function(err, result) {
		var table = TEST_API.getTable("t1");
		assert.ok(!err, err);
		assert.deepEqual(
			table.rows['1'].toJSON("object"), 
			{ id : 1, val : 'updated' },
			"The first row gets updated"
		);
		assert.deepEqual(
			table.rows['2'].toJSON("object"), 
			{ id : 2, val : 'updated' },
			"The second row gets updated"
		);
		QUnit.start();
	});
});

// Simple UPDATE with WHERE 
QUnit.asyncTest("UPDATE t1 SET val = 'updated' WHERE id = 1", function(assert) {
	TEST_API.query("UPDATE t1 SET val = 'updated' WHERE id = 1", function(err, result) {
		var table = TEST_API.getTable("t1");
		assert.ok(!err, err);
		assert.deepEqual(
			table.rows['1'].toJSON("object"), 
			{ id : 1, val : 'updated' },
			"The first row gets updated"
		);
		assert.deepEqual(
			table.rows['2'].toJSON("object"), 
			{ id : 2, val : 'b' },
			"The second row is NOT updated"
		);
		QUnit.start();
	});
});

// Using a column reference inside a SET expression
QUnit.asyncTest("UPDATE t1 SET val = id + '-updated'", function(assert) {
	TEST_API.query("UPDATE t1 SET val = id + '-updated'", function(err, result) {
		var table = TEST_API.getTable("t1");
		assert.ok(!err, err);
		assert.deepEqual(
			table.rows['1'].toJSON("object"), 
			{ id : 1, val : '1-updated' },
			"The first row gets updated"
		);
		assert.deepEqual(
			table.rows['2'].toJSON("object"), 
			{ id : 2, val : '2-updated' },
			"The second row gets updated"
		);
		QUnit.start();
	});
});

// Using a column reference inside a SET expression and WHERE
QUnit.asyncTest("UPDATE t1 SET val = id + '-updated' WHERE id = 1", function(assert) {
	TEST_API.query("UPDATE t1 SET val = id + '-updated' WHERE id = 1", function(err, result) {
		var table = TEST_API.getTable("t1");
		assert.ok(!err, err);
		assert.deepEqual(
			table.rows['1'].toJSON("object"), 
			{ id : 1, val : '1-updated' },
			"The first row gets updated"
		);
		assert.deepEqual(
			table.rows['2'].toJSON("object"), 
			{ id : 2, val : 'b' },
			"The second row is NOT updated"
		);
		QUnit.start();
	});
});

// Make sure that the primary index is re-ordered after update
QUnit.asyncTest("Make sure that the primary index is re-ordered after update", function(assert) {
	var table = TEST_API.getTable("t1"),
		index = table.keys.value_index._index;
	
	assert.deepEqual(index, ["a","b","c"]);

	TEST_API.query("UPDATE t1 SET val = 'd' WHERE id = 2", function(err, result) {
		
		assert.ok(!err, err);
		assert.deepEqual(index, ["a", "c", "d"]);
		QUnit.start();
	});
});

// Make sure that "beforeupdate:table" and "beforeupdate:row" events are triggered
QUnit.asyncTest('Make sure that "beforeupdate" and "update" events are triggered', function(assert) {
	var eventsFired = {
			"beforeupdate:table" : 0,
			"beforeupdate:row"   : 0,
			"update:table"       : 0,
			"update:row"         : 0
		},
		table = TEST_API.getTable("t1"),
		row   = table.rows['2'],
		sql   = "UPDATE t1 SET val = 'd' WHERE id = 2;";

	var h1 = TEST_API.on("beforeupdate:table", function(e, t) {
		eventsFired[e]++;
		assert.strictEqual(t, table, "The Table instance gets passed to the event listeners of " + e + " event");
	});

	var h2 = TEST_API.on("beforeupdate:row", function(e, r) {
		eventsFired[e]++;
		assert.strictEqual(r, row, "The TableRow instance gets passed to the event listeners of " + e + " event");
	});

	var h3 = TEST_API.on("update:table", function(e, t) {
		eventsFired[e]++;
		assert.strictEqual(t, table, "The Table instance gets passed to the event listeners of " + e + " event");
	});

	var h4 = TEST_API.on("update:row", function(e, r) {
		eventsFired[e]++;
		assert.strictEqual(r, row, "The TableRow instance gets passed to the event listeners of " + e + " event");
	});

	TEST_API.query(sql, function(err, result) {
		assert.ok(!err, err + " There should be no error. (query was: " + sql + ")");
		assert.strictEqual(eventsFired["beforeupdate:table"], 1, "The 'beforeupdate:table' event is fired once");
		assert.strictEqual(eventsFired["beforeupdate:row"], 1, "The 'beforeupdate:row' event is fired once");
		assert.strictEqual(eventsFired["update:table"], 1, "The 'update:table' event is fired once");
		assert.strictEqual(eventsFired["update:row"], 1, "The 'update:row' event is fired once");
		assert.deepEqual(
			row.toJSON("object"), 
			{ id : 2, val : 'd' },
			"The table is updated."
		);

		TEST_API.off("beforeupdate:table", h1);
		TEST_API.off("beforeupdate:row", h2);
		TEST_API.off("update:table", h3);
		TEST_API.off("update:row", h4);
		QUnit.start();
	});
});

// Make sure that an unique column cannot be updated to existing value
QUnit.asyncTest("Make sure that an unique column cannot be updated to existing value", function(assert) {
	var table = TEST_API.getTable("t1");
	TEST_API.query("UPDATE t1 SET id = 2 WHERE id = 1", function(err, result) {
		assert.ok(!!err, "Trying to duplicate a primary key must throw SQLConstraintError exception.");
		assert.deepEqual(
			table.rows['1'].toJSON("object"), 
			{ id : 1, val : 'a' },
			"The first row of the table is NOT updated."
		);
		assert.deepEqual(
			table.rows['2'].toJSON("object"), 
			{ id : 2, val : 'b' },
			"The second row of the table is NOT updated."
		);
		QUnit.start();
	});
});

// Make sure that "beforeupdate:table" and "beforeupdate:row" events are cancelable
QUnit.asyncTest('Make sure that "beforeupdate:table" and "beforeupdate:row" events are cancelable', function(assert) {
	var table = TEST_API.getTable("t1");

	TEST_API.one("beforeupdate:table", false);

	TEST_API.query("UPDATE t1 SET val = 'd'", function(err) {
		assert.ok(!err, "Must not fail: " + err);
		assert.deepEqual(table.rows['1'].toJSON("object"), { id : 1, val : 'a' }, "The first row IS NOT updated");
		assert.deepEqual(table.rows['2'].toJSON("object"), { id : 2, val : 'b' }, "The second row IS NOT updated");
		assert.deepEqual(table.rows['3'].toJSON("object"), { id : 3, val : 'c' }, "The third row IS NOT updated");

		TEST_API.one("beforeupdate:row", false);

		TEST_API.query("UPDATE t1 SET val = 'e'", function(err, result, idx) {
			assert.ok(!err, "Must not fail: " + err);
			assert.deepEqual(table.rows['1'].toJSON("object"), { id : 1, val : 'a' }, "The first row IS NOT updated");
			assert.deepEqual(table.rows['2'].toJSON("object"), { id : 2, val : 'e' }, "The second row is updated");
			assert.deepEqual(table.rows['3'].toJSON("object"), { id : 3, val : 'e' }, "The third row is updated");
			QUnit.start();
		});
	});
});

