(function() {

	module("transaction api");

	var Transaction = JSDB.Transaction;

	function txOptions(transactionName) {
		return {
			name : transactionName,
			onComplete : function onTransactionComplete() {
				if (QUnit.config.semaphore) {
					ok(true, 'Transaction "' + transactionName + '" complete');
					if (QUnit.config.semaphore)
						QUnit.start();
				}
			},
			onRollback : function onTransactionRollback() {
				if (QUnit.config.semaphore) {
					ok(true, 'Transaction "' + transactionName + '" was undone');
					if (QUnit.config.semaphore)
						QUnit.start();
				}
			},
			onError : function onTransactionError(e) {
				if (QUnit.config.semaphore) {
					ok(true, 'Transaction "' + transactionName + '" error: ' + e);
					if (QUnit.config.semaphore)
						QUnit.start();
				}
			}
		};
	}

	function createTask(options) {
		return Transaction.createTask({
			name  : options.name,
			weight: options.weight,
			execute : function(next) {
				if (options.fails) {
					ok(true, "Task " + this.transaction.getOption("name") + "." + this.name + " fails");
					next(true);
				} else if (options.throws) {
					throw "Task " + this.transaction.getOption("name") + "." + this.name + " throws an error";
				} else {
					ok(true, "Task " + this.transaction.getOption("name") + "." + this.name + " executes");
					next();
				}
			},
			undo : function(done) {
				if (!options.undoes) {
					throw "Task " + this.transaction.getOption("name") + "." + this.name + " fails to undo";
				} else {
					ok(true, "Task " + this.transaction.getOption("name") + "." + this.name + " undone");
					done();
				}
			}
		});
	}

	QUnit.asyncTest("Normal", function() {
		var tr = new Transaction(txOptions("tx1"));
		var task1 = createTask({ name  : "task1", weight: 1, fails : false, throws: false, undoes: true });
		var task2 = createTask({ name  : "task2", weight: 2, fails : false, throws: false, undoes: true });
		var task3 = createTask({ name  : "task3", weight: 3, fails : false, throws: false, undoes: true });
		var task4 = createTask({ name  : "task4", weight: 4, fails : false, throws: false, undoes: true });
		tr.add(task1);
		tr.add(task2);
		tr.add(task3);
		tr.add(task4);
		tr.start();
	});

	QUnit.asyncTest("Failing step", function() {
		var tr = new Transaction(txOptions("tx1"));
		var task1 = createTask({ name  : "task1", weight: 1, fails : false, throws: false, undoes: true });
		var task2 = createTask({ name  : "task2", weight: 2, fails : false, throws: false, undoes: true });
		var task3 = createTask({ name  : "task3", weight: 3, fails : false, throws: false, undoes: true });
		var task4 = createTask({ name  : "task4", weight: 4, fails : true , throws: false, undoes: true });
		tr.add(task1);
		tr.add(task2);
		tr.add(task3);
		tr.add(task4);
		tr.start();
	});

	QUnit.asyncTest("Failing step without auto-rollback", function() {
		var tr = new Transaction(txOptions("tx1"));

		var task1 = createTask({ name  : "task1", weight: 1, fails : false, throws: false, undoes: true });
		var task2 = createTask({ name  : "task2", weight: 2, fails : false, throws: false, undoes: true });
		var task3 = createTask({ name  : "task3", weight: 3, fails : false, throws: false, undoes: true });
		var task4 = createTask({ name  : "task4", weight: 4, fails : true , throws: false, undoes: true });
		
		tr.add(task1);
		tr.add(task2);
		tr.add(task3);
		tr.add(task4);

		tr.setOption("autoRollback", false);
		tr.start();
	});

	QUnit.asyncTest("Error handling", function() {
		var tr = new Transaction(txOptions("tx1"));
		var task1 = createTask({ name  : "task1", weight: 1, fails : false, throws: false, undoes: true });
		var task2 = createTask({ name  : "task2", weight: 2, fails : false, throws: false, undoes: true });
		var task3 = createTask({ name  : "task3", weight: 3, fails : false, throws: true , undoes: true });
		var task4 = createTask({ name  : "task4", weight: 4, fails : false, throws: false, undoes: true });
		tr.add(task1);
		tr.add(task2);
		tr.add(task3);
		tr.add(task4);
		tr.start();
	});

	QUnit.asyncTest("Undo failure", function() {
		var tr = new Transaction(txOptions("tx1"));
		var task1 = createTask({ name  : "task1", weight: 1, fails : false, throws: false, undoes: true  });
		var task2 = createTask({ name  : "task2", weight: 2, fails : false, throws: false, undoes: false });
		var task3 = createTask({ name  : "task3", weight: 3, fails : false, throws: false, undoes: true  });
		var task4 = createTask({ name  : "task4", weight: 4, fails : true , throws: false, undoes: true  });
		tr.add(task1);
		tr.add(task2);
		tr.add(task3);
		tr.add(task4);
		tr.start();
	});

	QUnit.asyncTest("Global timeout", function() {
		var tx = new Transaction(txOptions("tx1")),
			timer;

		tx.add(Transaction.createTask({
			name : "Task 1",
			execute : function(done, fail) {
				ok(true, "Running " + this.name);
				timer = setTimeout((function(done) { done(); })(done), 2500);
			},
			undo : function(done) {
				ok(true, "Undoing " + this.name);
				if (timer) clearTimeout(timer);
				done();
			}
		}));

		tx.start();
	});

	QUnit.asyncTest("Local task timeout", function() {
		var tx = new Transaction(txOptions("tx1")),
			timer1,
			timer2;

		tx.add(Transaction.createTask({
			name : "Task 1",
			timeout : 1600, // <- Big enough to succeed
			execute : function(done, fail) {
				ok(true, "Running " + this.name);
				timer1 = setTimeout((function(done) { done(); })(done), 1500);
			},
			undo : function(done) {
				ok(true, "Undoing " + this.name);
				done();
			}
		}));

		tx.add(Transaction.createTask({
			name : "Task 2",
			execute : function(done, fail) {
				ok(true, "Running " + this.name);
				timer2 = setTimeout((function(done) { done(); })(done), 1500);
			},
			undo : function(done) {
				ok(true, "Undoing " + this.name);
				done();
			}
		}));

		tx.start();
	});

	QUnit.asyncTest("Event callbacks", function(assert) {
		var tr = new Transaction({
			delay : 200,
			onTransactionComplete : function(e) {
				assert.strictEqual(e, "complete");
				start();
			},
			onRollback : function(e, err) {
				assert.strictEqual(e, "rollback");
				assert.ok(err, "onRollback: " + err);
				start();
			},
			onError : function(e, err) {
				assert.strictEqual(e, "error");
				assert.ok(err, "onError: " + err);
			},
			beforeTask : function(e, t, i) {
				assert.ok(t, "has task argument");
				assert.ok(i || i === 0, "has index argument");
				assert.strictEqual(e, "before:task", "beforeTask: " + t.name + ", index: " + i);
			},
			afterTask : function(e, t, i) {
				assert.ok(t, "has task argument");
				assert.ok(i || i === 0, "has index argument");
				assert.strictEqual(e, "after:task", "afterTask: " + t.name + ", index: " + i);
			},
			beforeUndo : function(e, t, i) {
				assert.ok(t, "has task argument");
				assert.ok(i || i === 0, "has index argument");
				assert.strictEqual(e, "before:undo", "beforeUndo: " + t.name + ", index: " + i);
			},
			afterUndo : function(e, t, i) {
				assert.ok(t, "has task argument");
				assert.ok(i || i === 0, "has index argument");
				assert.strictEqual(e, "after:undo", "afterUndo: " + t.name + ", index: " + i);
			},
			onProgress : function(q, t, i) {
				ok(true, "onProgress: " + q);
			}
		});

		var task1 = createTask({ name  : "task1", weight: 1, fails : false, throws: false, undoes: true });
		var task2 = createTask({ name  : "task2", weight: 2, fails : false, throws: false, undoes: true });
		var task3 = createTask({ name  : "task3", weight: 3, fails : false, throws: false, undoes: true });
		var task4 = createTask({ name  : "task4", weight: 4, fails : true , throws: false, undoes: true });
		tr.add(task1);
		tr.add(task2);
		tr.add(task3);
		tr.add(task4);
		tr.start();
    });

    QUnit.asyncTest("Nested transactions", function() {
    	var tr1 = new Transaction(txOptions("tx1"));
    	var tr2 = new Transaction(txOptions("tx2"));
    	var task1 = createTask({ name  : "task1", weight: 1, fails : false, throws: false, undoes: true });
		var task2 = createTask({ name  : "task2", weight: 2, fails : false, throws: false, undoes: true });
		var task3 = createTask({ name  : "task3", weight: 3, fails : false, throws: false, undoes: true });
		var task4 = createTask({ name  : "task4", weight: 4, fails : true , throws: false, undoes: true });
		
		tr1.add(task1);
		tr1.add(tr2);
		tr1.add(task4);

		tr2.add(task2);
		tr2.add(task3);

		QUnit.equal(tr2.getLength(), 2);
		QUnit.equal(tr1.getLength(), 3);

		QUnit.equal(tr2.getWeight(), 5 , "tr2.weight = 2 + 3 = 5");
		QUnit.equal(tr1.getWeight(), 10, "tr1.weight = 1 + (2 + 3) + 4 = 10");

		tr1.start();
    });

})();
