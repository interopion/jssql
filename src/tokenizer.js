////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                              SQL Tokenizer                                 //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
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
				   (SKIP_COMMENTS && (
				   		state === TOKEN_TYPE_COMMENT || 
				   		state === TOKEN_TYPE_MULTI_COMMENT)) ||
				   (SKIP_STR_QUOTS && 
				   	state === TOKEN_TYPE_PUNCTOATOR && 
				   	(buf == "'" || buf == '"' || buf == '`'));

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
		
		if (msg && msg !== true) {
			_error(msg);
		} else if (msg === false) {
			pos = -1;
		}
	}

	while ( (cur = sql[pos]) ) 
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
			
			// punctoators -----------------------------------------------------
			case ".":
				if (inStream) {
					buf += cur;
				} else {
					if (buf && (/^-?\d+$/).test(buf)) {
						state = TOKEN_TYPE_NUMBER;
						buf += cur;
					} else {
						if (buf) commit();
						next = sql[pos + 1];
						if (next && (/[0-9]/).test(next)) {
							state = TOKEN_TYPE_NUMBER;
							buf += cur;
						} else {
							state = TOKEN_TYPE_PUNCTOATOR;
							buf += cur;
							commit();
						}
					}
				}
				pos++;
			break;

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
					//case "Z" : buf += "\Z" ; break; // ASCII 26 (Control+Z)
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
