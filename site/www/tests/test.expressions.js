(function() {
	
	module("Expressions");

	var executeCondition = JSDB.executeCondition;

	QUnit.test("2 + 2 == 4", function(assert) {
		equal(executeCondition("2 + 2"), 4);
	});

	QUnit.test("Math.pow(2, 2) == 4", function(assert) {
		equal(executeCondition("Math.pow(2, 2)"), 4);
	});

	QUnit.test("Math.PI == 3.141592653589793", function(assert) {
		equal(executeCondition("Math.PI"), 3.141592653589793);
	});

	QUnit.test("NOW()", function(assert) {
		var date = new Date(),
			expected = date.getTime(), 
			result;

		result = executeCondition("NOW()");
		ok(expected == result || result == expected + 1);
	});

	QUnit.test("DATE()", function(assert) {
		var date = new Date(),
			time = date.getTime(), 
			result;

		result = executeCondition("DATE('%s', " + time + ")");
		equal(result, time);

		result = executeCondition("DATE('%s', new Date())");
		ok(Date.now() == result || result == Date.now() + 1);

		result = executeCondition("DATE('%s', Date.now())");
		ok(Date.now() == result || result == Date.now() + 1);

		result = executeCondition("DATE('%s', +new Date)");
		ok(Date.now() == result || result == Date.now() + 1);

		result = executeCondition("DATE('%s', date)", { date : date });
		equal(result, time);
	});

	QUnit.test("ROUND()", function(assert) {
		$.each({
			"ROUND(-1.23)"        : -1   ,
			"ROUND(-1.58)"        : -2   ,
			"ROUND(1.58)"         :  2   ,
			"ROUND(1.298, 1)"     :  1.3 ,
			"ROUND(1.298, 0)"     :  1   ,
			"ROUND(23.298, -1)"   :  20  ,
			"ROUND(234.298, -1)"  :  230 ,
			"ROUND(2345.298, -1)" :  2340,
			"ROUND(2345.298, -2)" :  2300,
			"ROUND(2345.298, -3)" :  2000
		}, function(arg, expected) {
			equal(executeCondition(arg), expected, arg + " -> " + expected);	
		});
	});

	QUnit.test("TRUNCATE()", function(assert) {
		$.each({
			"TRUNCATE(-1.23)"        : -1,
			"TRUNCATE(-1.58, 1)"     : -1.5,
			"TRUNCATE(1.58, 1)"      :  1.5,
			"TRUNCATE(1.298, 2)"     :  1.29,
			"TRUNCATE(1.298, 5)"     :  1.298,
			"TRUNCATE(23.298, -1)"   :  20  ,
			"TRUNCATE(234.298, -1)"  :  230 ,
			"TRUNCATE(2345.298, -1)" :  2340,
			"TRUNCATE(2345.298, -2)" :  2300,
			"TRUNCATE(2345.298, -3)" :  2000,
			"TRUNCATE(2345.2985, 3)" :  2345.298
		}, function(arg, expected) {
			equal(executeCondition(arg), expected, arg + " -> " + expected);	
		});
	});

})();
