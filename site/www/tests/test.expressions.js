(function() {
	
	module("Expressions");

	QUnit.test("2 + 2 == 4", function(assert) {
		equal(JSDB.executeCondition("2 + 2"), 4);
	});

	QUnit.test("Math.pow(2, 2) == 4", function(assert) {
		equal(JSDB.executeCondition("Math.pow(2, 2)"), 4);
	});

	QUnit.test("Math.PI == 3.141592653589793", function(assert) {
		equal(JSDB.executeCondition("Math.PI"), 3.141592653589793);
	});

})();
