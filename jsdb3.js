(function() {

	var 

	// Token type constants
	TOKEN_TYPE_UNKNOWN             = 0,
	TOKEN_TYPE_WORD                = 1,
	TOKEN_TYPE_NUMBER              = 2,
	TOKEN_TYPE_OPERATOR            = 3,
	TOKEN_TYPE_SINGLE_QUOTE_STRING = 4,
	TOKEN_TYPE_DOUBLE_QUOTE_STRING = 5,
	TOKEN_TYPE_BACK_TICK_STRING    = 6,
	TOKEN_TYPE_SUBMIT              = 7,
	TOKEN_TYPE_COMMENT             = 8,
	TOKEN_TYPE_MULTI_COMMENT       = 9,
	TOKEN_TYPE_PUNCTOATOR          = 10,
	//TOKEN_TYPE_BLOCK_OPEN          = 11,
	//TOKEN_TYPE_BLOCK_CLOSE         = 12,
	TOKEN_TYPE_SPACE               = 13,
	TOKEN_TYPE_EOL                 = 14,
	TOKEN_TYPE_EOF                 = 15;

	OPERATORS = {

		// Logical Operators
		ALL     : 1,
		AND     : 1,
		ANY     : 1,
		BETWEEN : 1,
		EXISTS  : 1,
		IN      : 1,
		LIKE    : 1,
		NOT     : 1,
		OR      : 1,
		IS      : 1,
		NULL    : 1,
		UNIQUE  : 1,
		IF      : 1,

		// Comparison Operators
		"!=" : 1,
		"<>" : 1,
		">=" : 1,
		"<=" : 1,
		"!<" : 1,
		"!>" : 1,
		"="  : 1,
		">"  : 1,
		"<"  : 1,

		// Arithmetic Operators
		"+" : 1,
		"-" : 1,
		"*" : 1,
		"/" : 1,
		"%" : 1
	},

	DATABASES = {},

	TOKEN_TYPE_MAP = {};
	TOKEN_TYPE_MAP[TOKEN_TYPE_UNKNOWN]             = "character";
	TOKEN_TYPE_MAP[TOKEN_TYPE_WORD]                = "word";
	TOKEN_TYPE_MAP[TOKEN_TYPE_NUMBER]              = "number";
	TOKEN_TYPE_MAP[TOKEN_TYPE_OPERATOR]            = "operator";
	TOKEN_TYPE_MAP[TOKEN_TYPE_SINGLE_QUOTE_STRING] = "string";
	TOKEN_TYPE_MAP[TOKEN_TYPE_DOUBLE_QUOTE_STRING] = "string";
	TOKEN_TYPE_MAP[TOKEN_TYPE_BACK_TICK_STRING]    = "string";
	TOKEN_TYPE_MAP[TOKEN_TYPE_SUBMIT]              = "character";
	TOKEN_TYPE_MAP[TOKEN_TYPE_COMMENT]             = "comment";
	TOKEN_TYPE_MAP[TOKEN_TYPE_MULTI_COMMENT]       = "comment";
	TOKEN_TYPE_MAP[TOKEN_TYPE_PUNCTOATOR]          = "punctoator";
	//TOKEN_TYPE_MAP[TOKEN_TYPE_BLOCK_OPEN]          = "character";
	//TOKEN_TYPE_MAP[TOKEN_TYPE_BLOCK_CLOSE]         = "character";
	TOKEN_TYPE_MAP[TOKEN_TYPE_SPACE]               = "space";
	TOKEN_TYPE_MAP[TOKEN_TYPE_EOL]                 = "new line";
	TOKEN_TYPE_MAP[TOKEN_TYPE_EOF]                 = "end of input";

	function strf(s) 
	{
		var args = arguments, l = args.length, i = 0;
		return s.replace(/(%s)/g, function(a, match) {
			return ++i > l ? match : args[i];
		});
	}

	function prettyList(arr) 
	{
		var len = arr.length, last;
		if (len === 0) {
			return '';
		}
		if (len === 1) {
			return arr[0];
		}
		
		last = arr.pop();
		return "one of " + arr.join(", ") + " or " + last;
	}

	function quote(str, q) {
		q = q || "'";
		return q + str.replace(q, q + "" + q) + q;
	}

	function error(options)
	{
		options = typeof options == "string" ? 
			{ message : options } : 
			options || { message : "Unknown error" };

		var args = Array.prototype.slice.call(arguments, 1), msg, start, tmp, txt;
		var params = [];

		args.unshift(options.message);
		msg = txt = strf.apply({}, args);

		
		params.push("font-weight:bold;color:red;", msg);
		msg = "%c%s";
		
		if ("file" in options) {
			msg += "%c \n   file: %s";
			params.push("font-weight:bold;", options.file);
		}
		if ("line" in options) {
			msg += "%c \n   line: %i";
			params.push("font-weight:bold", options.line);
		}
		if ("col" in options) {
			msg += "%c \n column: %i";
			params.push("font-weight:bold", options.col);
		}
		if ("token" in options) {
			msg += "%c \n   char: %i";
			params.push("font-weight:bold", options.token[2]);//console.log(options.token);
			if ("src" in options) {
				
				start = Math.max(options.token[2] - 50, 0);
				msg += "%c \n around: %c%s%c%s%c%s";

				params.push(
					// around:
					"font-weight:bold",

					// match before
					"color:#666", 
					"..." + options.src.substring(start, options.token[2]),
					
					// match
					"color:#000;font-weight:bold;background:orange;padding:3px;border-radius:3px;text-indent:5px;display:inline-block !important;", 
					options.src.substring(options.token[2], options.token[3]).replace(/\n/g, "¬\n"),

					// match after
					"color:#666", 
					options.src.substr(options.token[3], 50) + "..." 
				);
			}
		}

		params.unshift(msg);
		//console.log(params.join(""))
		console.log.apply(console, params);
		throw new SyntaxError(txt);
	}

	function getTokens(sql, options)
	{
		var tokens = [],
			level  = 0,
			i      = 0;

		function openBlock() { 
			level++; 
		}
		function closeBlock() { 
			level--; 
		}
		function handleToken(tok)
		{
			tokens[i++] = tok;
		}

		tokenize(sql, handleToken, openBlock, closeBlock, options);

		if (level > 0) {
			throw new SyntaxError("Unclosed block");
		}
		if (level < 0) {
			throw new SyntaxError("Extra closing block");
		}

		return tokens;
	}

	////////////////////////////////////////////////////////////////////////////
	//                                                                        //
	//                            SQL Tokenizer                               //
	//                                                                        //
	////////////////////////////////////////////////////////////////////////////
	function tokenize(sql, tokenCallback, openBlock, closeBlock, options)
	{
		var pos   = 0,
			buf   = "",
			state = TOKEN_TYPE_UNKNOWN,
			line  = 1,
			col   = 0,
			start = 0,
			i     = 0,
			cfg   = options || {},
			token, cur, next, inStream;

		var SKIP_SPACE     = !!cfg.skipSpace;
		var SKIP_EOL       = !!cfg.skipEol;
		var SKIP_COMMENTS  = !!cfg.skipComments;
		var SKIP_STR_QUOTS = !!cfg.skipStrQuots;

		function _error(msg)
		{
			var args = Array.prototype.slice.call(arguments, 1);
			args.unshift({
				message : msg,
				line    : line,
				col     : col,
				pos     : pos,
				src     : sql,
				token   : token
			});
			error.apply({}, args);
		}

		function commit()
		{
			var msg,
				skip = (SKIP_SPACE && state === TOKEN_TYPE_SPACE) || 
					   (SKIP_EOL   && state === TOKEN_TYPE_EOL) || 
					   (SKIP_COMMENTS && (state === TOKEN_TYPE_COMMENT || state === TOKEN_TYPE_MULTI_COMMENT)) ||
					   (SKIP_STR_QUOTS && state === TOKEN_TYPE_PUNCTOATOR && (buf == "'" || buf == '"' || buf == '`'));

			if (!skip) { 
				token = [
					buf,
					state || (/^-?\d+$/.test(buf) ? 
						TOKEN_TYPE_NUMBER : 
						buf in OPERATORS ?
							TOKEN_TYPE_OPERATOR :
							TOKEN_TYPE_WORD
					),
					//line,          // line
					//col,           // col
					start, // start
					pos//,       // end
					//_len  // length
				];

				msg = tokenCallback(token);
			}

			buf   = "";
			state = TOKEN_TYPE_UNKNOWN;
			start = pos;
			
			if (msg) {
				_error(msg);
			}
		}

		while ( cur = sql[pos] ) 
		{
			//if (++i > 1000) return;

			inStream  = state === TOKEN_TYPE_SINGLE_QUOTE_STRING ||
						state === TOKEN_TYPE_DOUBLE_QUOTE_STRING ||
						state === TOKEN_TYPE_BACK_TICK_STRING    ||
						state === TOKEN_TYPE_MULTI_COMMENT       ||
						state === TOKEN_TYPE_COMMENT;
			//debugger;
			switch (cur) 
			{
				
				// Single line comments ----------------------------------------
				case "-":

					// if inside a string or comment - just append
					if (inStream) 
					{
						buf += cur;
					}
					else 
					{
						// Should we start a single line comment?
						if (sql[pos + 1] == "-") 
						{
							if (buf) commit();
							buf = cur;
							state = TOKEN_TYPE_COMMENT;
						}

						// The "-" char should be an operator 
						else 
						{
							// Commit pending buffer (if any)
							if (state !== TOKEN_TYPE_OPERATOR) {
								if (buf) commit();
								state = TOKEN_TYPE_OPERATOR;
							}

							buf += cur;
						}
					}
					pos++;
				break;

				// Multi line comments -----------------------------------------
				case "/":
					// if inside a string or single-line comment - just append
					if (state === TOKEN_TYPE_SINGLE_QUOTE_STRING ||
						state === TOKEN_TYPE_DOUBLE_QUOTE_STRING ||
						state === TOKEN_TYPE_BACK_TICK_STRING    ||
						state === TOKEN_TYPE_COMMENT) 
					{
						buf += cur;
						pos++;
					}
					else 
					{
						// Should we close a multi-line comment or jus append to it?
						if (state === TOKEN_TYPE_MULTI_COMMENT) 
						{
							buf += cur;
							if (sql[pos - 1] == "*") 
							{
								if (buf) commit(); // close
							}
							pos++;
						}
						else
						{
							// Should we start new multi-line comment?
							if (sql[pos + 1] == "*")
							{
								if (buf) commit();
								buf += cur;
								state = TOKEN_TYPE_MULTI_COMMENT;
								pos++;
							}

							// The "/" char should be an operator 
							else
							{
								// Commit pending buffer (if any)
								if (state !== TOKEN_TYPE_OPERATOR)
								{
									if (buf) commit();
									state = TOKEN_TYPE_OPERATOR;
								}
								buf += cur;
								pos++;
							}
						}
					}
				break;

				// EOLs --------------------------------------------------------
				case "\n":
					line++;
					if ( inStream && state !== TOKEN_TYPE_COMMENT ) {
						buf += cur;
						pos++;
						col = 0;
					} else {
						if (buf) commit();
						state = TOKEN_TYPE_EOL;
						buf += cur;
						pos++;
						col = 0;
						commit();
					}
				break;

				// String in single quotes -------------------------------------
				case "'":
					if (state === TOKEN_TYPE_SINGLE_QUOTE_STRING) 
					{
						// Don't close on double "'"
						if (sql[pos + 1] == cur) {
							buf += cur;
							pos += 2;
						}

						// Close string
						else 
						{
							commit();
							buf += cur;
							pos++;
							state = TOKEN_TYPE_PUNCTOATOR;
							commit();
						}
					} 
					
					else { 
						
						// Allow "'" in comments and other strings
						if (inStream) 
						{
							buf += cur;
							pos++;
						}

						// Start new string
						else 
						{
							if (buf) commit();
							buf += cur;
							pos++;
							state = TOKEN_TYPE_PUNCTOATOR;
							commit();
							state = TOKEN_TYPE_SINGLE_QUOTE_STRING;
						}
					}
				break;
				
				// String in double quotes -------------------------------------
				case '"':
					if (state === TOKEN_TYPE_DOUBLE_QUOTE_STRING) 
					{
						// Don't close on double '"'
						if (sql[pos + 1] == cur) 
						{
							buf += cur;
							pos += 2;
						} 

						// Close string
						else 
						{
							commit();
							buf += cur;
							pos++;
							state = TOKEN_TYPE_PUNCTOATOR;
							commit();
						}
					} 
					else 
					{
						// Allow '"' in comments or other strings
						if (inStream) 
						{
							buf += cur;
							pos++;
						}

						// Start new string
						else 
						{
							if (buf) commit();
							buf += cur;
							pos++;
							state = TOKEN_TYPE_PUNCTOATOR;
							commit();
							state = TOKEN_TYPE_DOUBLE_QUOTE_STRING;
						}
					}
				break;
				
				// String in back ticks ----------------------------------------
				case '`':
					if (state === TOKEN_TYPE_BACK_TICK_STRING) 
					{
						// Don't close on double '`'
						if (sql[pos + 1] == cur) 
						{
							buf += cur;
							pos += 2;
						} 

						// Close string
						else 
						{
							commit();
							buf += cur;
							pos++;
							state = TOKEN_TYPE_PUNCTOATOR;
							commit();
						}
					} 
					else 
					{
						// Allow '`' in comments and other strings
						if (inStream) 
						{
							buf += cur;
							pos++;
						}

						// Start new string
						else 
						{
							if (buf) commit();
							buf += cur;
							pos++;
							state = TOKEN_TYPE_PUNCTOATOR;
							commit();
							state = TOKEN_TYPE_BACK_TICK_STRING;
						}
					}
				break;

				// Block start -------------------------------------------------
				case "(":
					if (inStream) {
						buf += cur;
						pos++;
					} else {
						if (buf) commit();
						state = TOKEN_TYPE_PUNCTOATOR;
						buf = cur;
						pos++;
						commit();
						openBlock();
					}
				break;

				// Block end ---------------------------------------------------
				case ")":
					if (inStream) {
						buf += cur;
						pos++;
					} else {
						if (buf) commit();
						closeBlock();
						state = TOKEN_TYPE_PUNCTOATOR;
						buf = cur;
						pos++;
						commit();
					}
					//pos++;
				break;

				// Submit ------------------------------------------------------
				case ";":
					if (inStream) {
						buf += cur;
						pos++;
					} else {
						if (buf) commit();
						pos++;
						state = TOKEN_TYPE_SUBMIT;
						buf = cur;
						commit();
					}
				break;

				// White space -------------------------------------------------
				case " ":
				case "\t":
					if (!inStream && state !== TOKEN_TYPE_SPACE) {
						if (buf) commit();
						state = TOKEN_TYPE_SPACE;
					}
					buf += cur;
					pos++;
				break;

				// operators ---------------------------------------------------
				case "!":
					if (inStream) {
						buf += cur;
						pos++;
					} else {
						if (buf) commit();
						state = TOKEN_TYPE_OPERATOR;
						buf += cur;
						next = sql[pos + 1];
						if (next == "=" || next == "<" || next == ">") {
							buf += next;
							pos++;
						}
						commit();
						pos++;
					}
				break;

				case "<":
					if (inStream) {
						buf += cur;
						pos++;
					} else {
						if (buf) commit();
						state = TOKEN_TYPE_OPERATOR;
						buf += cur;
						next = sql[pos + 1];
						if (next == "=" || next == ">") {
							buf += next;
							pos++;
						}
						commit();
						pos++;
					}
				break;

				case ">":
					if (inStream) {
						buf += cur;
						pos++;
					} else {
						if (buf) commit();
						state = TOKEN_TYPE_OPERATOR;
						buf += cur;
						next = sql[pos + 1];
						if (next == "=") {
							buf += next;
							pos++;
						}
						commit();
						pos++;
					}
				break;

				case "=": 
				case "+": 
				case "-": 
				case "*": 
				case "/": 
				case "%":
					if (inStream) {
						buf += cur;
						pos++;
					} else {
						if (buf) commit();
						state = TOKEN_TYPE_OPERATOR;
						buf += cur;
						commit();
						pos++;
					}
				break;
				
				// punctoators -------------------------------------------------
				case ".": 
				case ",": 
					if (inStream) {
						buf += cur;
					} else {
						if (buf) commit();
						state = TOKEN_TYPE_PUNCTOATOR;
						buf += cur;
						commit();
					}
					pos++;
				break;

				// Escape sequences --------------------------------------------
				case "\\":
					pos++;
					next = sql[pos];
					pos++;
					switch (next) {
						case "0" : buf += "\0" ; break; // An ASCII NUL (0x00)
						case "b" : buf += "\b" ; break; // A backspace character
						case "n" : buf += "\n" ; break; // A newline (linefeed)
						case "r" : buf += "\r" ; break; // A carriage return
						case "t" : buf += "\t" ; break; // A tab character
						case "Z" : buf += "\Z" ; break; // ASCII 26 (Control+Z)
						case "%" : buf += "\\%"; break;
						case "_" : buf += "\\_"; break;
						default  : buf += next ; break;
					}
				break;
				
				// Everything else ---------------------------------------------
				default:
					if (state === TOKEN_TYPE_SPACE) {
						if (buf) commit();
					}
					buf += cur;
					pos++;
				break;
			}
			//pos++;
			col++;
		}

		if (buf) commit();

		if (state === TOKEN_TYPE_SINGLE_QUOTE_STRING) {
			throw 'Unexpected end of input. Expecting \'.';
		} else if (state === TOKEN_TYPE_DOUBLE_QUOTE_STRING) {
			throw 'Unexpected end of input. Expecting ".';
		} else if (state === TOKEN_TYPE_BACK_TICK_STRING) {
			throw 'Unexpected end of input. Expecting `.';
		} else if (state === TOKEN_TYPE_MULTI_COMMENT) {
			throw 'Unexpected end of input. Expecting */.';
		}

		if (cfg.addEOF) {
			state = TOKEN_TYPE_EOF;
			commit();
		}
	}

	////////////////////////////////////////////////////////////////////////////
	//                                                                        //
	//                             SQL Parser                                 //
	//                                                                        //
	////////////////////////////////////////////////////////////////////////////
	function parse( sql )
	{
		var query = {
			sql : sql
		};

		var currentState;

		// Dedecated parsers ---------------------------------------------------
		var parsers = {

			"IDDLE" : function() {
				this.handleToken = function(token) {
					if (token[1] === TOKEN_TYPE_SUBMIT) {
						// TODO: execute
						setState("VERB");
					}
				};
			},

			"VERB" : function() {
				this.handleToken = function(token) 
				{
					if ( token[1] === TOKEN_TYPE_EOF) {
						return;
					}
					if ( token[1] !== TOKEN_TYPE_WORD ) {
						return 'Unexpected ' + TOKEN_TYPE_MAP[token[1]] + ' "' + 
							token[0].replace(/\n/g, "¬\n") + '".\n' + 
							'Expecting a verb. keyword.';
					}

					switch ( token[0].toUpperCase() ) {

						//Data Definition Statements
						//case "ALTER":
						//	break;
						case "CREATE":
							setState("CREATE");
							return;
						//case "DROP":
						//	break;
						//case "RENAME":
						//	break;
						//case "TRUNCATE":
						//	break;

						//Data Manipulation Statements
						//case "CALL":
						//case "DELETE":
						//	break;
						//case "DO":
						//case "HANDLER":
						//case "INSERT":
						//	break;
						//case "REPLACE":
						//case "SELECT":
						//	break;
						//case "UPDATE":
						//	break;
					}

					return 'Unexpected word "' + token[0] + '". The parser ' + 
						'does not recognise it as valid SQL command.';
				};
			},

			"CREATE" : function() {
				
				// CREATE {DATABASE | SCHEMA} [IF NOT EXISTS] db_name
				// CREATE [TEMPORARY] TABLE [IF NOT EXISTS] tbl_name
				var expect = ["DATABASE","SCHEMA","TABLE","TEMPORARY"];

				this.handleToken = function(token) {console.log(token)
					var word = token[0].toUpperCase();

					if (word == "DATABASE" || word == "SCHEMA") {
						setState("CREATE_DATABASE");
						return;
					}

					if (word == "TEMPORARY") {
						expect = ["TABLE"];
						return;
					}
					if (word == "TABLE") {
						subject = "TABLE";
						setState("CREATE_TABLE");
						return;
					}

					return 'Unexpected "' + TOKEN_TYPE_MAP[token[1]] + '".' + 
						(expect ? ' Expecting ' + prettyList(expect) : '');
				};
			},

			"CREATE_DATABASE" : function() {
				var expect = ["'IF NOT EXISTS'", "database_name"];
				var query = new CreateDatabaseQuery();
				var buf = "",
					name, 
					ifNotExist = false;
				this.handleToken = function(token) {

					if (query.name()) {
						if (token[1] === TOKEN_TYPE_SUBMIT) {
							query.execute();
							setState("IDDLE");
						}
						return;
					}

					var word = token[0].toUpperCase();

					if (word == "IF") {
						expect = ["NOT"];
						buf += word;
						return;
					}
					if (word == "NOT") {
						if (buf != "IF") {
							error({
								message : "Unexpected 'NOT'",
								token   : token
							});
						}
						buf += ' NOT';
						expect = ["EXISTS"];
						return;
					}
					if (word == "EXISTS") {
						if (buf != "IF NOT") {
							throw "Unexpected 'EXISTS'";
						}
						buf += ' EXISTS';
						expect = null;
						return;
					}

					if (buf == "IF NOT EXISTS") {
						query.ifNotExists(true);
					}

					if (token[1] === TOKEN_TYPE_WORD || 
						token[1] === TOKEN_TYPE_SINGLE_QUOTE_STRING || 
						token[1] === TOKEN_TYPE_DOUBLE_QUOTE_STRING || 
						token[1] === TOKEN_TYPE_BACK_TICK_STRING) {
						query.name(token[0]);
						console.dir(query);
						console.log(query.toString());
						//query.execute();
						//setState("IDDLE");
						return;
					}

					return 'Unexpected "' + TOKEN_TYPE_MAP[token[1]] + '".' + 
						(expect ? ' Expecting ' + prettyList(expect) : '');
				};
			},

			"CREATE_TABLE" : function() {
				this.handleToken = function(token) {

				};
			}
		};

		var state = {
			handleBlockOpen  : function() {},
			handleBlockClose : function() {},
			handleToken      : function() {}
		};

		function setState(name) {
			if (currentState !== name) {
				state.handleToken = (new parsers[name]()).handleToken;
				currentState = name;
			}
		}

		setState("VERB");

		tokenize(
			sql, 
			function(token) {
				return state.handleToken(token);
			},
			function() {
				return state.handleBlockOpen();
			},
			function() {
				return state.handleBlockClose();
			},
			{
				skipComments : true,
				skipSpace    : true,
				skipEol      : true,
				addEOF       : true,
				skipStrQuots : true
			}
		);
	}

	////////////////////////////////////////////////////////////////////////////
	//                                                                        //
	//                          Class Database                                //
	//                                                                        //
	////////////////////////////////////////////////////////////////////////////
	function Database(name, tables) 
	{
	}

	////////////////////////////////////////////////////////////////////////////
	//                                                                        //
	//                         SQL Query Classes                              //
	//                                                                        //
	////////////////////////////////////////////////////////////////////////////

	function Query() {}

	function CreateQuery() {}
	CreateQuery.prototype = new CreateQuery();
	CreateQuery.prototype.toString = function() {
		return this.generateSQL();
	};
	
	// CreateDatabaseQuery -----------------------------------------------------
	function CreateDatabaseQuery() {}
	CreateDatabaseQuery.prototype = new CreateQuery();
	CreateDatabaseQuery.prototype._name = undefined;
	CreateDatabaseQuery.prototype._ifNotExists = false;
	CreateDatabaseQuery.prototype.generateSQL = function() 
	{
		if (typeof this._name != "string") {
			throw "Invalid database name";
		}
		if (!this._name) {
			throw "No database name";
		}
		return "CREATE DATABASE " + (this._ifNotExists ? "IF NOT EXISTS " : "") + 
			quote(this._name, '"');
	};
	
	CreateDatabaseQuery.prototype.execute = function() 
	{
		if (typeof this._name != "string") {
			throw "Invalid database name";
		}
		if (!this._name) {
			throw "No database name";
		}
		if (!this._ifNotExists && DATABASES.hasOwnProperty(this._name)) {
			throw new Error('Database "' + name + '" already exists');
		}
		DATABASES[name] = new Database(name);
	};

	CreateDatabaseQuery.prototype.ifNotExists = function(bIf) 
	{
		if (bIf === undefined) {
			return this._ifNotExists;
		}
		this._ifNotExists = !!bIf;
		return this;
	};
	CreateDatabaseQuery.prototype.name = function(val) 
	{
		if (val) {
			this._name = String(val);
			return this;
		}
		return this._name;
	};

	// CreateTableQuery -----------------------------------------------------
	function CreateTableQuery() {}
	CreateTableQuery.prototype = new CreateQuery();
	CreateTableQuery.prototype.generateSQL = function() {};
	CreateTableQuery.prototype.execute = function() {};
	CreateTableQuery.prototype.ifNotExist = function(bIf) {};
	CreateTableQuery.prototype.name = function(val) {};

	JSDB = {

		// Export these for testing
		TOKEN_TYPE_UNKNOWN             : TOKEN_TYPE_UNKNOWN,
		TOKEN_TYPE_WORD                : TOKEN_TYPE_WORD,
		TOKEN_TYPE_NUMBER              : TOKEN_TYPE_NUMBER,
		TOKEN_TYPE_OPERATOR            : TOKEN_TYPE_OPERATOR,
		TOKEN_TYPE_SINGLE_QUOTE_STRING : TOKEN_TYPE_SINGLE_QUOTE_STRING,
		TOKEN_TYPE_DOUBLE_QUOTE_STRING : TOKEN_TYPE_DOUBLE_QUOTE_STRING,
		TOKEN_TYPE_BACK_TICK_STRING    : TOKEN_TYPE_BACK_TICK_STRING,
		TOKEN_TYPE_SUBMIT              : TOKEN_TYPE_SUBMIT,
		TOKEN_TYPE_COMMENT             : TOKEN_TYPE_COMMENT,
		TOKEN_TYPE_MULTI_COMMENT       : TOKEN_TYPE_MULTI_COMMENT,
		TOKEN_TYPE_PUNCTOATOR          : TOKEN_TYPE_PUNCTOATOR,
		//TOKEN_TYPE_BLOCK_OPEN          : TOKEN_TYPE_BLOCK_OPEN,
		//TOKEN_TYPE_BLOCK_CLOSE         : TOKEN_TYPE_BLOCK_CLOSE,
		TOKEN_TYPE_SPACE               : TOKEN_TYPE_SPACE,
		TOKEN_TYPE_EOL                 : TOKEN_TYPE_EOL,
		TOKEN_TYPE_EOF                 : TOKEN_TYPE_EOF,

		tokenize  : tokenize,
		getTokens : getTokens,
		parse     : parse
	};

})();