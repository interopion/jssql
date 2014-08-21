(function() {
	
	////////////////////////////////////////////////////////////////////////////
	function startJSDBTestModule(name, options)
	{
		var inst = this, cfg  = {};

		function connect(onComplete)
		{
			if (!JSDB.SERVER.loaded) {
				JSDB.events.one("load:server", onComplete, cfg.onError);
			} else {
				onComplete();
			}
		}

		function createDB(onComplete)
		{
			JSDB.query(
				'CREATE DATABASE IF NOT EXISTS "' + cfg.db + '";', 
				onComplete, 
				cfg.onError
			);
		}
		
		function selectDB(onComplete)
		{
			JSDB.query(
				'USE "' + cfg.db + '";', 
				onComplete, 
				cfg.onError
			);
		}

		function createTables(onComplete)
		{
			if (cfg.createTablesSQL)
				JSDB.query(cfg.createTablesSQL, onComplete, cfg.onError);
			else
				onComplete();
		}

		function insertData(onComplete)
		{
			if (cfg.insertDataSQL)
				JSDB.query(cfg.insertDataSQL, onComplete, cfg.onError);
			else
				onComplete();
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
			var sql = 'DROP DATABASE "' + cfg.db + '";';
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

		function init(onComplete)
		{
			connect(function() {
				createDB(function() {
					selectDB(function() {
						createTables(function() {
							insertData(function() {
								JSDB.query(
									'USE "' + cfg.db + '";',
									onComplete, 
									cfg.onError
								);
							});
						});
					});
				});
			});
		}

		options = options || {};

		cfg.onError = typeof options.onError == "function" ? 
			options.onError :
			function(error) {
				console.error(error);
			};

		cfg.db              = options.db || "unitTestingDB";
		cfg.createTablesSQL = options.createTablesSQL || null;
		cfg.insertDataSQL   = options.insertDataSQL || null;
		
		module(name, { setup : setup, teardown : teardown });

	}
	////////////////////////////////////////////////////////////////////////////
	
	startJSDBTestModule("UPDATE", {
		
		createTablesSQL : 'CREATE TABLE IF NOT EXISTS t1 (' + 
			'id  INT(2) NULL, ' + 
			'val VARCHAR(20) NULL,' + 
			'PRIMARY KEY (id),' +	
			'KEY value_index (val)' + 
		');',
		
		insertDataSQL : "INSERT INTO t1(id, val) VALUES " + 
			"(1, 'a')," + 
			"(2, 'b')," +
			"(3, 'c');"
	});

	// Simple UPDATE that runs on all of the rows
	QUnit.asyncTest("UPDATE t1 SET val = 'updated';", function(assert) {
		var sql   = "UPDATE t1 SET val = 'updated';",
			table = JSDB.SERVER.databases.unitTestingDB.tables.t1;
		JSDB.query(
			sql, 
			function() {
				assert.deepEqual(
					table.rows['1'].toJSON(), 
					{ id : 1, val : 'updated' },
					"The first row gets updated"
				);
				assert.deepEqual(
					table.rows['2'].toJSON(), 
					{ id : 2, val : 'updated' },
					"The second row gets updated"
				);
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	// Simple UPDATE with WHERE 
	QUnit.asyncTest("UPDATE t1 SET val = 'updated' WHERE id = 1;", function(assert) {
		var sql   = "UPDATE t1 SET val = 'updated' WHERE id = 1;",
			table = JSDB.SERVER.databases.unitTestingDB.tables.t1;
		JSDB.query(
			sql, 
			function() {
				assert.deepEqual(
					table.rows['1'].toJSON(), 
					{ id : 1, val : 'updated' },
					"The first row gets updated"
				);
				assert.deepEqual(
					table.rows['2'].toJSON(), 
					{ id : 2, val : 'b' },
					"The second row is NOT updated"
				);
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	// Using a column reference inside a SET expression
	QUnit.asyncTest("UPDATE t1 SET val = id + '-updated';", function(assert) {
		var sql   = "UPDATE t1 SET val = id + '-updated';",
			table = JSDB.SERVER.databases.unitTestingDB.tables.t1;
		JSDB.query(
			sql, 
			function() {
				assert.deepEqual(
					table.rows['1'].toJSON(), 
					{ id : 1, val : '1-updated' },
					"The first row gets updated"
				);
				assert.deepEqual(
					table.rows['2'].toJSON(), 
					{ id : 2, val : '2-updated' },
					"The second row gets updated"
				);
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	// Using a column reference inside a SET expression and WHERE
	QUnit.asyncTest("UPDATE t1 SET val = id + '-updated' WHERE id = 1;", function(assert) {
		var sql   = "UPDATE t1 SET val = id + '-updated' WHERE id = 1;",
			table = JSDB.SERVER.databases.unitTestingDB.tables.t1;
			
		JSDB.query(
			sql, 
			function() {
				assert.deepEqual(
					table.rows['1'].toJSON(), 
					{ id : 1, val : '1-updated' },
					"The first row gets updated"
				);
				assert.deepEqual(
					table.rows['2'].toJSON(), 
					{ id : 2, val : 'b' },
					"The second row is NOT updated"
				);
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	// Make sure that the primary index is re-ordered after update
	QUnit.asyncTest("Make sure that the primary index is re-ordered after update", function(assert) {
		var sql   = "UPDATE t1 SET val = 'd' WHERE id = 2;",
			table = JSDB.SERVER.databases.unitTestingDB.tables.t1,
			index = table.keys.value_index._index;
			

		assert.deepEqual(index, ["a","b","c"]);

		JSDB.query(
			sql, 
			function() {
				assert.deepEqual(index, ["a", "c", "d"]);
				QUnit.start();
			}, 
			function(error) {
				QUnit.pushFailure(error.message || "Failed", sql);
				QUnit.start();
			}
		);
	});

	// Make sure that "before_update:table" and "before_update:row" events are triggered
	QUnit.asyncTest(
		'Make sure that "before_update:table" and "before_update:row" events are triggered', 
		function(assert) {
			var tableEventFired = false,
				rowEventFired  = false,
				table = JSDB.SERVER.databases.unitTestingDB.tables.t1,
				row   = table.rows['2'],
				sql   = "UPDATE t1 SET val = 'd' WHERE id = 2;";

			JSDB.events.one("before_update:table", function(t) {
				tableEventFired = true;
				assert.strictEqual(t, table, "The Table instance gets passed to the event listeners");
			});

			JSDB.events.one("before_update:row", function(r) {
				rowEventFired = true;
				assert.strictEqual(r, row, "The TableRow instance gets passed to the event listeners");
			});

			JSDB.query(
				sql,
				function() {
					assert.strictEqual(tableEventFired, true, "The 'before_update:table' event is fired");
					assert.strictEqual(rowEventFired  , true, "The 'before_update:row' event is fired");

					assert.deepEqual(
						row.toJSON(), 
						{ id : 2, val : 'd' },
						"The table is updated."
					);

					QUnit.start();
				}, 
				function(error) {
					QUnit.pushFailure(error.message || "Failed", sql);
					QUnit.start();
				}
			);
		}
	);

	// Make sure that an unique column cannot be updated to existing value
	QUnit.asyncTest(
		"Make sure that an unique column cannot be updated to existing value",
		function(assert) {
			var sql = "UPDATE t1 SET id = 2 WHERE id = 1;",
				table = table = JSDB.SERVER.databases.unitTestingDB.tables.t1;

			JSDB.query(
				sql, 
				function() {
					QUnit.pushFailure(
						"Trying to duplicate a primary key must throw SQLConstraintError exception.", 
						sql
					);
					
					if (QUnit.config.semaphore)
						QUnit.start();
				},
				function(error) {
					QUnit.push(1,1,1,"Failed as expected");
					assert.deepEqual(
						table.rows['1'].toJSON(), 
						{ id : 1, val : 'a' },
						"The first row of the table is NOT updated."
					);
					assert.deepEqual(
						table.rows['2'].toJSON(), 
						{ id : 2, val : 'b' },
						"The second row of the table is NOT updated."
					);
					//assert.ok(error instanceof JSDB.SQLConstraintError);
					console.error(error);
					if (QUnit.config.semaphore)
						QUnit.start();
				}
			);
		}
	);

	// Make sure that "before_update:table" and "before_update:row" events are cancelable
	QUnit.asyncTest(
		'Make sure that "before_update:table" and "before_update:row" events are cancelable', 
		function(assert) {
			var table = JSDB.SERVER.databases.unitTestingDB.tables.t1,
				sql   = "UPDATE t1 SET val = 'd';";

			JSDB.events.one("before_update:table", false);

			JSDB.query(
				sql,
				function() {
					QUnit.pushFailure("Must not succeed!", sql);
					if (QUnit.config.semaphore)
						QUnit.start();
				}, 
				function(error) {
					QUnit.push(error.message, 1, 1, "Must fail: " + error.message || "Failed", sql);
					if (QUnit.config.semaphore) 
						QUnit.start();
				}
			);
			//QUnit.start();
		}
	);

	

})();
