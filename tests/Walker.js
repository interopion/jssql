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

		// OR-ing token types
		ok(createWalker("table").is("@" + JSDB.TOKEN_TYPE_NUMBER + "|@" + JSDB.TOKEN_TYPE_WORD));

		// OR-ing mixed arguments
		ok(createWalker("table").is("@" + JSDB.TOKEN_TYPE_NUMBER + "|TABLE"));
		ok(createWalker("table").is("@" + JSDB.TOKEN_TYPE_WORD + "|X"));
	});
	
})();
