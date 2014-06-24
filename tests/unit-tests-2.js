(function() {

	module("Tokenizer");

	var tokenize  = JSDB.tokenize,
		getTokens = JSDB.getTokens,
		operators = [">", "<", "=", "!>", "!<", "!=", "<>", "+", "-", "*", "/", "%", "<=", ">="];

	function assertTokensCount(tokens, value, msg) {
		equal(tokens.length, value, msg || "The set must contain " + value + " tokens");
	}
	function assertTokenValue(token, value, msg) {
		equal(token[0], value, msg || "The token value must equal to '" + value + "'");
	}
	function assertTokenType(token, type, msg) {
		equal(token[1], type, msg || "The token must be of type " + type);
	}
	//function assertTokenLine(token, value, msg) {
	//	equal(token[2], value, msg || "The token line must be " + value);
	//}
	//function assertTokenCol(token, value, msg) {
	//	equal(token[3], value, msg || "The token col must be " + value);
	//}
	function assertTokenStart(token, value, msg) {
		equal(token[2], value, msg || "The token start must be " + value);
	}
	function assertTokenEnd(token, value, msg) {
		equal(token[3], value, msg || "The token end must be " + value);
	}
	function assertTokenLength(token, value, msg) {
		equal(token[3] - token[2], value, msg || "The token length must be " + value);
	}

	test('Multi line comments', function() {
		var tok = getTokens("/**/");
		assertTokensCount(tok, 1);
		assertTokenType(tok[0], JSDB.TOKEN_TYPE_MULTI_COMMENT);
		assertTokenValue(tok[0], "/**/");

		tok = getTokens(" /**/");
		assertTokensCount(tok, 2);
		assertTokenType(tok[1], JSDB.TOKEN_TYPE_MULTI_COMMENT);
		assertTokenValue(tok[1], "/**/");
		

		tok = getTokens(" /* */");
		assertTokensCount(tok, 2);
		assertTokenType(tok[1], JSDB.TOKEN_TYPE_MULTI_COMMENT);
		assertTokenValue(tok[1], "/* */");

		tok = getTokens(" /*  */");
		assertTokensCount(tok, 2);
		assertTokenType(tok[1], JSDB.TOKEN_TYPE_MULTI_COMMENT);
		assertTokenValue(tok[1], "/*  */");

		tok = getTokens(" /* a*/");
		assertTokensCount(tok, 2);
		assertTokenType(tok[1], JSDB.TOKEN_TYPE_MULTI_COMMENT);
		assertTokenValue(tok[1], "/* a*/");

		tok = getTokens("a /* */");
		assertTokensCount(tok, 3);
		assertTokenType(tok[2], JSDB.TOKEN_TYPE_MULTI_COMMENT);
		assertTokenValue(tok[2], "/* */");
	});

	test('Single line comments', function() {
		var tok = getTokens("--");
		assertTokensCount(tok, 1);
		assertTokenType(tok[0], JSDB.TOKEN_TYPE_COMMENT);
		assertTokenValue(tok[0], "--");

		tok = getTokens(" --");
		assertTokensCount(tok, 2);
		assertTokenType(tok[1], JSDB.TOKEN_TYPE_COMMENT);
		assertTokenValue(tok[1], "--");
		
		tok = getTokens("-- x");
		assertTokensCount(tok, 1);
		assertTokenType(tok[0], JSDB.TOKEN_TYPE_COMMENT);
		assertTokenValue(tok[0], "-- x", "x");

		tok = getTokens(" -- ");
		assertTokensCount(tok, 2);
		assertTokenType(tok[1], JSDB.TOKEN_TYPE_COMMENT);
		assertTokenValue(tok[1], "-- ");
		
		tok = getTokens(" -- a");
		assertTokensCount(tok, 2);
		assertTokenType(tok[1], JSDB.TOKEN_TYPE_COMMENT);
		assertTokenValue(tok[1], "-- a");

		tok = getTokens("a -- ");
		assertTokensCount(tok, 3);
		assertTokenType(tok[2], JSDB.TOKEN_TYPE_COMMENT);
		assertTokenValue(tok[2], "-- ");
	});

	test('White Space', function() {
		$.each(String("a/8[]:;><=*&^%$#@!±§_-+\\~.").split(""), function(i, c) {
			var n = c == "\\" ? 2 : 4,
				tok = getTokens(" " + c + " x");
			assertTokensCount(tok, n, '" ' + c + ' x" must contain ' + n + ' tokens');
			if (tok.length !== n) {
				console.dir(tok);
			}
		});

		$.each(operators, function(i, c) {
			var n = 3,
				tok = getTokens(" " + c + " ");
			assertTokensCount(tok, n, '" ' + c + ' " must contain ' + n + ' tokens');
			if (tok.length !== n) {
				console.dir(tok);
			}
		});

		var tok = getTokens(" () x");
		assertTokensCount(tok, 5, '" () x" must contain 5 tokens');
	});

	test('Word', function() {
		var tok = getTokens("SELECT");
		assertTokensCount(tok, 1);
		assertTokenType(tok[0], JSDB.TOKEN_TYPE_WORD);
		assertTokenValue(tok[0], "SELECT");
		assertTokenStart(tok[0], 0);
		assertTokenEnd(tok[0], 6);
		assertTokenLength(tok[0], 6);

		tok = getTokens("  SELECT");
		assertTokensCount(tok, 2);
		assertTokenType(tok[1], JSDB.TOKEN_TYPE_WORD);
		assertTokenValue(tok[1], "SELECT");
		assertTokenStart(tok[1], 2);
		assertTokenEnd(tok[1], 8);
		assertTokenLength(tok[1], 6);

		tok = getTokens(" SELECT something ");
		assertTokensCount(tok, 5);
		assertTokenType(tok[0], JSDB.TOKEN_TYPE_SPACE);
		assertTokenType(tok[1], JSDB.TOKEN_TYPE_WORD);
		assertTokenType(tok[2], JSDB.TOKEN_TYPE_SPACE);
		assertTokenType(tok[3], JSDB.TOKEN_TYPE_WORD);
		assertTokenType(tok[4], JSDB.TOKEN_TYPE_SPACE);
		assertTokenValue(tok[1], "SELECT");
		assertTokenValue(tok[3], "something");
		assertTokenStart(tok[1], 1);
		assertTokenStart(tok[3], 8);
		assertTokenEnd(tok[1], 7);
		assertTokenEnd(tok[3], 17);
		assertTokenLength(tok[1], 6);
		assertTokenLength(tok[3], 9);
	});

	test('Operators', function() {
		$.each(operators, function(i, op) {
			var tok = getTokens(op);
			assertTokensCount(tok, 1);
			assertTokenType(tok[0], JSDB.TOKEN_TYPE_OPERATOR);
			assertTokenValue(tok[0], op);
		});
		
		var tok = getTokens("==");
		assertTokensCount(tok, 2);
		assertTokenType(tok[0], JSDB.TOKEN_TYPE_OPERATOR);
		assertTokenValue(tok[0], "=");
		assertTokenType(tok[1], JSDB.TOKEN_TYPE_OPERATOR);
		assertTokenValue(tok[1], "=");

		tok = getTokens("!==");
		assertTokensCount(tok, 2);
		assertTokenType(tok[0], JSDB.TOKEN_TYPE_OPERATOR);
		assertTokenValue(tok[0], "!=");
		assertTokenType(tok[1], JSDB.TOKEN_TYPE_OPERATOR);
		assertTokenValue(tok[1], "=");
	});

	test('Submit', function() {
		var tok = getTokens(" ; ");
		assertTokensCount(tok, 3);
		assertTokenType(tok[1], JSDB.TOKEN_TYPE_SUBMIT);
		assertTokenValue(tok[1], ";");
		assertTokenStart(tok[1], 1);
		assertTokenEnd(tok[1], 2);
		assertTokenLength(tok[1], 1);
	});

	$.each({
		"'" : ["Single-quoted string"  , JSDB.TOKEN_TYPE_SINGLE_QUOTE_STRING],
		'"' : ["Double-quoted string"  , JSDB.TOKEN_TYPE_DOUBLE_QUOTE_STRING],
		'`' : ["Backtick-quoted string", JSDB.TOKEN_TYPE_BACK_TICK_STRING   ]
	}, function(q, meta) {
		test(meta[0], function() {
			var str = "  " + q + "test" + q + " ",
				tok = getTokens(str);
			assertTokensCount(tok, 5, '"' + str + '" must contain 5 tokens');

			assertTokenType(tok[0], JSDB.TOKEN_TYPE_SPACE, "Token 1 must be of type SPACE");
			assertTokenType(tok[1], JSDB.TOKEN_TYPE_PUNCTOATOR, "Token 2 must be of type PUNCTOATOR");
			assertTokenType(tok[2], meta[1], "Token 3 must be of type " + meta[1]);
			assertTokenType(tok[3], JSDB.TOKEN_TYPE_PUNCTOATOR, "Token 4 must be of type PUNCTOATOR");
			assertTokenType(tok[4], JSDB.TOKEN_TYPE_SPACE, "Token 5 must be of type SPACE");

			assertTokenValue(tok[0], '  '  , 'Token 1 must contain "  "'  );
			assertTokenValue(tok[1], q     , 'Token 2 must contain ' + q  );
			assertTokenValue(tok[2], "test", 'Token 3 must contain "test"');
			assertTokenValue(tok[3], q     , 'Token 4 must contain ' + q  );
			assertTokenValue(tok[4], ' '   , 'Token 5 must contain " "'   );

			assertTokenStart(tok[0], 0, 'Token 1 must start at 0');
			assertTokenStart(tok[1], 2, 'Token 2 must start at 2');
			assertTokenStart(tok[2], 3, 'Token 3 must start at 3');
			assertTokenStart(tok[3], 7, 'Token 4 must start at 7');
			assertTokenStart(tok[4], 8, 'Token 5 must start at 8');

			assertTokenEnd(tok[0], 2, 'Token 1 must end at 2');
			assertTokenEnd(tok[1], 3, 'Token 2 must end at 3');
			assertTokenEnd(tok[2], 7, 'Token 3 must end at 7');
			assertTokenEnd(tok[3], 8, 'Token 4 must end at 8');
			assertTokenEnd(tok[4], 9, 'Token 5 must end at 9');

			assertTokenLength(tok[0], 2, 'The length of token 1 must be 2');
			assertTokenLength(tok[1], 1, 'The length of token 2 must be 1');
			assertTokenLength(tok[2], 4, 'The length of token 3 must be 4');
			assertTokenLength(tok[3], 1, 'The length of token 4 must be 1');
			assertTokenLength(tok[4], 1, 'The length of token 5 must be 1');

			str = q + "te" + q + "" + q + "st" + q;
			tok = getTokens(str);
			assertTokensCount(tok, 3, str + ' must contain 3 tokens');
			assertTokenValue(tok[1], 'te' + q + 'st', 'The string ' + str + ' must evaluate to ' + q + "te" + q + "st" + q);

			str = q + "te\\" + q + "st" + q;
			tok = getTokens(str);
			assertTokensCount(tok, 3, str + ' must contain 3 tokens');
			assertTokenValue(tok[1], 'te' + q + 'st', 'The string ' + str + ' must evaluate to ' + q + "te" + q + "st" + q);
		});
	});	

	test('Blocks', function() {
		var tok;

		// blocks in single or multiple levels
		assertTokenValue(getTokens("(x)")[1], "x", "In '(x)' token 2 must be 'x'");
		assertTokenValue(getTokens("((x))")[2], "x", "In '((x))' token 3 must be 'x'");
		assertTokenValue(getTokens("(((x)))")[3], "x", "In '(((x)))' token 4 must be 'x'");
		
		// don't start blocks inside strings
		tok = getTokens("'a(b)c'");
		assertTokensCount(tok, 3);
		assertTokenValue(tok[1], "a(b)c");

		tok = getTokens('"a(b)c"');
		assertTokensCount(tok, 3);
		assertTokenValue(tok[1], "a(b)c");

		tok = getTokens('`a(b)c`');
		assertTokensCount(tok, 3);
		assertTokenValue(tok[1], "a(b)c");

		// don't start blocks inside comments
		tok = getTokens('--a(b)c');
		assertTokensCount(tok, 1);
		assertTokenValue(tok[0], "--a(b)c");

		tok = getTokens('/*a(b)c*/');
		assertTokensCount(tok, 1);
		assertTokenValue(tok[0], "/*a(b)c*/");

		// Assert the correct open/close call order
		var str = "a(b)c",
			out = "",
			bOpen = function() { out += "["; },
			bClose = function() { out += "]"; },
			tok = function(t) { out += t[0]; };

		tokenize(str, tok, bOpen, bClose);
		equal(out, "a([b])c");

		str = "a(b(c)d)e";
		out = "";
		tokenize(str, tok, bOpen, bClose);
		equal(out, "a([b([c])d])e");

	});
	
	test('New Lines', function() {
		var tok = getTokens(" \n \n ");//console.dir(tok);
		assertTokensCount(tok, 5);
		assertTokenLength(tok[1], 1);
		assertTokenLength(tok[3], 1);
	});
	
	test("Numbers", function() {
		var tok = getTokens("55");//console.dir(tok);
		assertTokensCount(tok, 1);
		assertTokenLength(tok[0], 2);
		assertTokenValue(tok[0], "55");
		assertTokenType(tok[0], JSDB.TOKEN_TYPE_NUMBER);

		tok = getTokens("5.3");//console.dir(tok);
		assertTokensCount(tok, 1, "Floating point number must be matched as one token");
		assertTokenLength(tok[0], 3);
		assertTokenValue(tok[0], "5.3");
		assertTokenType(tok[0], JSDB.TOKEN_TYPE_NUMBER);
	});

	//module("Table");
	
	/*test("Testing insert", function() {
		var db = JSDB.SERVER.createDatabase("unit_tests_db", true);
		var table = new JSDB.Table("users", db);
		
		table.addColumn({
			name : "id",
			type : {
				name : "INT",
				params : ["10"]
			},
			nullable : true
		});
		
		table.addColumn({
			name : "name",
			type : {
				name : "VARCHAR",
				params : ["100"]
			}
		});
		
		ok(
			"id" in table.cols && "name" in table.cols, 
			"The columns must be stored"
		);
		
		deepEqual(
			table._col_seq, 
			["id", "name"], 
			"The column sequence (table._col_seq) must list the column names in insertin order"
		);
		
		table.insert(
			["id", "name"], 
			[
				[1, "User 1"]
			]
		);
		
		equal(table._length, 1, "The '_length' must be incremented after insert");
		equal(table._ai, 2, "The '_ai' must be incremented after insert");
		deepEqual(
			table._row_seq, 
			[1], 
			"The row sequence (table._row_seq) must be updated after insert"
		);
		
		deepEqual(
			table.rows[1].toArray(),
			[1   , "User 1"],
			"The rows (table.rows) must be updated after insert"
		);
		
		JSDB.SERVER.dropDatabase("unit_tests_db", true);	
	});*/
	
})();