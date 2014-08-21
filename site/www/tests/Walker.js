(function() {

	module("Walker");

	function createWalker(input)
	{
		var tokens = JSDB.getTokens(input, {
			skipComments : true,
			skipSpace    : true,
			skipEol      : true,
			//addEOF       : true,
			skipStrQuots : true
		});
		return new JSDB.Walker(tokens, input);
	}

	test("forward", function() {
		var walker = createWalker("create table 'tablename' if not exists");
		equal(walker._pos, 0);
		equal(walker.forward()._pos, 1);

		walker._pos = 0;
		equal(walker.forward(3)._pos, 3);
		equal(walker.forward(1)._pos, 4);
		throws(function() {
			walker.forward(5);
		});
	});

	test("back", function() {
		var walker = createWalker("create table 'tablename' if not exists;");
		walker._pos = 6;

		equal(walker._pos, 6);
		equal(walker.back()._pos, 5);
		equal(walker.back(3)._pos, 2);
		equal(walker.back(1)._pos, 1);
		throws(function() {
			walker.back(5);
		});
	});
	
	test("next", function() {
		var walker = createWalker("create table if not exists 'tablename'");
		equal(walker._pos, 0);
		equal(walker.next()[0], 'table');
		equal(walker.next()[0], 'if');
		equal(walker.next()[0], 'not');
		equal(walker.next()[0], 'exists');
		equal(walker.next()[0], 'tablename');
		equal(walker.next(), false);
	});

	test("prev", function() {
		var walker = createWalker("create table if not exists 'tablename'");
		walker._pos = 6;
		equal(walker._pos, 6);
		equal(walker.prev()[0], 'tablename');
		equal(walker.prev()[0], 'exists');
		equal(walker.prev()[0], 'not');
		equal(walker.prev()[0], 'if');
		equal(walker.prev()[0], 'table');
		equal(walker.prev()[0], 'create');
		equal(walker.prev(), false);
	});


	test("is", function() {

		// Case insensitive word match
		ok(createWalker("table").is("table"));
		ok(createWalker("table").is("TABLE"));
		ok(createWalker("TABLE").is("table"));

		// Case sensitive word match
		ok(!createWalker("table").is("Table", true));
		ok(!createWalker("table").is("TABLE", true));
		ok(!createWalker("TABLE").is("table", true));

		// Token type match
		ok(createWalker("table").is("@" + JSDB.TOKEN_TYPE_WORD));
		ok(!createWalker("table").is("@" + JSDB.TOKEN_TYPE_NUMBER));

		// Negative word matching
		ok(createWalker("a").is("!b"));
		ok(createWalker("b").is("!a"));

		// Sequence
		ok(createWalker("ORDER BY").is("ORDER BY"), "sequence");
		var walker = createWalker("ORDER BY column ASC");

		ok(walker.is("ORDER BY") && walker.forward(2) && walker.is("column ASC"), "multy-sequence");

		// OR-ing token types
		ok(createWalker("table").is("@" + JSDB.TOKEN_TYPE_NUMBER + "|@" + JSDB.TOKEN_TYPE_WORD));

		// OR-ing mixed arguments
		ok(createWalker("table").is("@" + JSDB.TOKEN_TYPE_NUMBER + "|TABLE"));
		ok(createWalker("table").is("@" + JSDB.TOKEN_TYPE_WORD + "|X"));

		// AND
		ok(createWalker("table").is("@" + JSDB.TOKEN_TYPE_WORD + "&TABLE"));
		ok(createWalker("'table'").is("!@" + JSDB.TOKEN_TYPE_WORD + "&TABLE"));
		ok(createWalker("table").is("@" + JSDB.TOKEN_TYPE_WORD + "&!TABLES"));
	});
	
})();
