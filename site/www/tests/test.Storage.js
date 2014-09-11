(function() {

	module("Storage");

	function testEngine(options, engineLabel) {
		
		QUnit.asyncTest("Get " + engineLabel, function(assert) {
			jsSQL.getStorageEngine(options, function(err, engine) {
				assert.ok(!err, "must not fail loading the engine: " + err);
				assert.ok(!!engine);
				QUnit.start(1);
			});
		});
		
		QUnit.asyncTest(engineLabel + ": set, get, unset", function(assert) {
			jsSQL.getStorageEngine(options, function(err, engine) {
				assert.ok(!err, "must not fail loading the engine: " + err);
				engine.set("test-set", "test value", function(err) {
					assert.ok(!err, "set must not fail: " + err);
					engine.get("test-set", function(err, data) {
						assert.ok(!err, "get must not fail: " + err);
						assert.equal(data, "test value", "Must be able to get the written value");
						engine.unset("test-set", function(err) {
							assert.ok(!err, "unset must not fail: " + err);
							engine.get("test-set", function(err, data) {
								assert.strictEqual(data, null, "Get after delete must result in null value");
								QUnit.start();
							});
						});
					});
				});
			});
		});
		
		QUnit.asyncTest(engineLabel + ": setMany, getMany, unsetMany", function(assert) {
			jsSQL.getStorageEngine(options, function(err, engine) {
				var map = {
					"test-set-1" : "test value 1",
					"test-set-2" : "test value 2"
				}, 
				keys = ["test-set-1"  , "test-set-2"  ],
				vals = ["test value 1", "test value 2"];

				engine.setMany(map, function(err) {
					assert.ok(!err, "setMany must not fail: " + err);
					engine.getMany(keys, function(err, data) {
						assert.ok(!err, "getMany must not fail: " + err);
						assert.deepEqual(data, vals, "Must be able to get the written value");
						engine.unsetMany(keys, function(err) {
							assert.ok(!err, "unsetMany must not fail: " + err);
							engine.getMany(keys, function(err, data) {
								assert.deepEqual(data, [null, null], "getMany after delete must result in nulls");
								QUnit.start();
							});
						});
					});
				});
			});
		});

		if (options.type == "LocalStorage" || options.type == "SessionStorage") {
			jsSQL.getStorageEngine(options, function(err, engine) {
				QUnit.asyncTest("Exceeding " + options.type + " limit", function(assert) {
					var data = new Array(1024 * 1024 * 6).join("a");
					engine.set("test-key", data, function(err) {
						data = null;
						assert.ok(!!err, "Must fail: " + err);
						engine.unset("test-key", function() {// just in case
							while (QUnit.config.semaphore)
								QUnit.start();
						});
					});
					QUnit.stop();
				});
			});
		}
	}

	var engines = jsSQL.getRegisteredStorageEngines();
	for (var id in engines) {
		testEngine({
			type  : id,
			debug : !!QUnit.config.debug
		}, engines[id].label || id );
	}
})();