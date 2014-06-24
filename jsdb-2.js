
(function(GLOBAL,undefined){
"use strict";

// -----------------------------------------------------------------------------
// Starts file "src/constants.js"
// -----------------------------------------------------------------------------
var 

SERVER,
STATEMENTS = {},
NS = "JSDB",

// Token type constants --------------------------------------------------------
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
TOKEN_TYPE_EOF                 = 15,

STRING = [
	TOKEN_TYPE_DOUBLE_QUOTE_STRING, 
	TOKEN_TYPE_SINGLE_QUOTE_STRING, 
	TOKEN_TYPE_BACK_TICK_STRING
],
WORD_OR_STRING = [
	TOKEN_TYPE_WORD, 
	TOKEN_TYPE_DOUBLE_QUOTE_STRING, 
	TOKEN_TYPE_SINGLE_QUOTE_STRING, 
	TOKEN_TYPE_BACK_TICK_STRING
],
NUMBER_OR_STRING = [
	TOKEN_TYPE_NUMBER, 
	TOKEN_TYPE_DOUBLE_QUOTE_STRING, 
	TOKEN_TYPE_SINGLE_QUOTE_STRING, 
	TOKEN_TYPE_BACK_TICK_STRING
],
ANY_VALUE = [
	TOKEN_TYPE_NUMBER, 
	TOKEN_TYPE_DOUBLE_QUOTE_STRING, 
	TOKEN_TYPE_SINGLE_QUOTE_STRING, 
	TOKEN_TYPE_BACK_TICK_STRING,
	TOKEN_TYPE_WORD
],
		
// State constants -------------------------------------------------------------
STATE_IDDLE    = 0,
STATE_WAITING  = 2,
STATE_WORKING  = 4,
STATE_ERROR    = 8,
STATE_COMPLETE = 16,

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
	//NULL    : 1,
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

DATA_TYPES = [
	"BIT", // [(length)]
	"TINYINT", // [(length)] [UNSIGNED] [ZEROFILL]
	"SMALLINT", // [(length)] [UNSIGNED] [ZEROFILL]
	"MEDIUMINT", // [(length)] [UNSIGNED] [ZEROFILL]
	"INT", // [(length)] [UNSIGNED] [ZEROFILL]
	"INTEGER", // [(length)] [UNSIGNED] [ZEROFILL]
	"BIGINT", // [(length)] [UNSIGNED] [ZEROFILL]
	"REAL", // [(length,decimals)] [UNSIGNED] [ZEROFILL]
	"DOUBLE", // [(length,decimals)] [UNSIGNED] [ZEROFILL]
	"FLOAT", // [(length,decimals)] [UNSIGNED] [ZEROFILL]
	"DECIMAL", // [(length[,decimals])] [UNSIGNED] [ZEROFILL]
	"NUMERIC", // [(length[,decimals])] [UNSIGNED] [ZEROFILL]
	"DATE",
	"TIME", // [(fsp)]
	"TIMESTAMP", // [(fsp)]
	"DATETIME", // [(fsp)]
	"YEAR",
	"CHAR", // [(length)] [CHARACTER SET charset_name] [COLLATE collation_name]
	"VARCHAR", // (length) [CHARACTER SET charset_name] [COLLATE collation_name]
	"BINARY", // [(length)]
	"VARBINARY", //(length)
	"TINYBLOB",
	"BLOB",
	"MEDIUMBLOB",
	"LONGBLOB",
	"TINYTEXT", // [BINARY] [CHARACTER SET charset_name] [COLLATE collation_name]
	"TEXT", //  [BINARY] [CHARACTER SET charset_name] [COLLATE collation_name]
	"MEDIUMTEXT", //  [BINARY][CHARACTER SET charset_name] [COLLATE collation_name]
	"LONGTEXT", //  [BINARY][CHARACTER SET charset_name] [COLLATE collation_name]
	"ENUM", // (value1,value2,value3,...)[CHARACTER SET charset_name] [COLLATE collation_name]
	"SET"//, // (value1,value2,value3,...)[CHARACTER SET charset_name] [COLLATE collation_name]
	//"spatial_type"
],

DATABASES = {},
CURRENT_DATABASE,

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


// -----------------------------------------------------------------------------
// Starts file "src/utils.js"
// -----------------------------------------------------------------------------
/**
 * Returns the float representation of the first argument or the
 * "defaultValue" if the float conversion is not possible.
 * @param {*} x The argument to convert
 * @param {*} defaultValue The fall-back return value. This is going to be
 *                         converted to float too.
 * @return {Number} The resulting floating point number.
 */
function floatVal(x, defaultValue) 
{
    var out = parseFloat(x);
    if (isNaN(out) || !isFinite(out)) {
        out = defaultValue === undefined ? 0 : floatVal(defaultValue);
    }
    return out;
}

/**
 * Returns the int representation of the first argument or the
 * "defaultValue" if the int conversion is not possible.
 * @param {*} x The argument to convert
 * @param {*} defaultValue The fall-back return value. This is going to be
 *                         converted to integer too.
 * @return {Number} The resulting integer.
 */
function intVal(x, defaultValue) 
{
    var out = parseInt(x, 10);
    if (isNaN(out) || !isFinite(out)) {
        out = defaultValue === undefined ? 0 : intVal(defaultValue);
    }
    return out;
}

/**
 * Rounds the given number to configurable precision.
 * @param {numeric} n The argument to round.
 * @param {Number} p The precision (number of digits after the
 *                   decimal point) to use.
 * @return {Number} The resulting number.
 */
function roundToPrecision(n, p) 
{
    n = parseFloat(n);
    if (isNaN(n) || !isFinite(n)) {
        return NaN;
    }
    if (!p || isNaN(p) || !isFinite(p) || p < 1) {
        return Math.round(n);
    }
    var q = Math.pow(10, p);
    return Math.round(n * q) / q;
}

/**
 * Simplified version of printf. Just replaces all the occurrences of "%s" with
 * whatever is supplied in the rest of the arguments. If no argument is supplied
 * the "%s" token is left as is.
 * @param {String} s The string to format
 * @param {*}+ The rest of the arguments are used for the replacements
 * @return {String}
 */
function strf(s) 
{
	var args = arguments, 
		l = args.length, 
		i = 0;
	return s.replace(/(%s)/g, function(a, match) {
		return ++i > l ? match : args[i];
	});
}

/**
 * Generates and returns a human-readable representation of arrays. This is used 
 * to generate the "expecting one of" strings... 
 * @param {Array} The array to join
 * @return {String} 
 */
function prettyList(arr) 
{
	var len = arr.length, last;
	if (len === 0) {
		return '';
	}
	if (len === 1) {
		return quote(arr[0]);
	}
	if (len == 2) {
		return quote(arr[0]) + " or " + quote(arr[1]);
	}
	
	var out = [], i;
	for(i = 0; i < arr.length; i++) {
		out.push(quote(arr[i]));
	}
	last = out.pop();

	return "one of " + out.join(", ") + " or " + last;
}

/**
 * Quotes a string using the specified quotation mark (should be one of '|"|`).
 * @param {String} 
 */
function quote(str, q) 
{
	q = q || '"';
	return q + String(str).replace(q, q + "" + q) + q;
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

function trim(str)
{
	return String(str).replace(/^\s+|\s+$/, "");
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
	//	throw new SyntaxError("Unclosed block");
	}
	if (level < 0) {
	//	throw new SyntaxError("Extra closing block");
	}

	return tokens;
}

/**
 * Selects the current database.
 * @param {String} sql The name of the databse
 * @throws {SQLRuntimeError} if the database does not exist.
 * @return void
 */
function setCurrentDatabase(name) 
{
	var db = trim(name);
	if (!SERVER.databases.hasOwnProperty(db)) {
		throw new SQLRuntimeError('No such database "%s".', db);
	}
	CURRENT_DATABASE = SERVER.databases[db];
}

function createTable(name, fields, ifNotExists, database)
{
	database = database || CURRENT_DATABASE;
	if (!database) {
		throw new SQLRuntimeError("No database selected");
	}
	
	return database.createTable(name, fields, ifNotExists);
}

function dropTable(name, ifExists, database) 
{
	database = database || CURRENT_DATABASE;
	if (!database) {
		throw new SQLRuntimeError("No database selected");
	}

	if (!database.tables.hasOwnProperty(name)) {
		if (!ifExists) {
			throw new SQLRuntimeError('Table "%s" does not exist', name);
		}
	}

	delete database.tables[name];
}

function each(o, callback, scope)
{
	var key, len, argLen = arguments.length;
	
	if (argLen < 2 || !o || typeof o != "object") {
		return;
	}
	
	if (Object.prototype.toString.call(o) == "[object Array]") {
		if ( typeof o.every == "function" ) {
			return o.every(callback, scope);
		}
		len = o.length;
		for ( key = 0; key < len; key++ ) {
			if ( argLen > 2 ) {
				if ( callback.call(scope, o[key], key, o) === false ) {
					break;
				}
			} else {
				if ( callback(o[key], key, o) === false ) {
					break;
				}
			}
		}
	} else {
		for ( key in o ) {
			if ( argLen > 2 ) {
				if ( callback.call(scope, o[key], key, o) === false ) { 
					break;
				}
			} else {
				if ( callback(o[key], key, o) === false ) { 
					break;
				}
			}
		}
	}
}

function every(o, callback, scope)
{
	var key, len, argLen = arguments.length;
	
	if (argLen < 2 || !o || typeof o != "object") {
		return false;
	}
	
	if (Object.prototype.toString.call(o) == "[object Array]") {
		if ( typeof o.every == "function" ) {
			return o.every(callback, scope);
		}
		len = o.length;
		for ( key = 0; key < len; key++ ) {
			if ( argLen > 2 ) {
				if ( callback.call(scope, o[key], key, o) === false ) {
					return false;
				}
			} else {
				if ( callback(o[key], key, o) === false ) {
					return false;
				}
			}
		}
	} else {
		for ( key in o ) {
			if ( argLen > 2 ) {
				if ( callback.call(scope, o[key], key, o) === false ) { 
					return false;
				}
			} else {
				if ( callback(o[key], key, o) === false ) { 
					return false;
				}
			}
		}
	}
	return true;
}

function some(o, callback, scope)
{
	var key, len, argLen = arguments.length;
	
	if (argLen < 2 || !o || typeof o != "object") {
		return false;
	}
	
	if (Object.prototype.toString.call(o) == "[object Array]") {
		if ( typeof o.some == "function" ) {
			return o.some(callback, scope);
		}
		len = o.length;
		for ( key = 0; key < len; key++ ) {
			if ( argLen > 2 ) {
				if ( callback.call(scope, o[key], key, o) === true ) {
					return true;
				}
			} else {
				if ( callback(o[key], key, o) === true ) {
					return true;
				}
			}
		}
	} else {
		for ( key in o ) {
			if ( argLen > 2 ) {
				if ( callback.call(scope, o[key], key, o) === true ) { 
					return true;
				}
			} else {
				if ( callback(o[key], key, o) === true ) { 
					return true;
				}
			}
		}
	}
	return false;
}

function keys(o, all) {
	var out = [], x;
	for (x in o) {
		if (all || o.hasOwnProperty(x)) {
			out.push(x);
		}
	}
	return out;
}

function noop() {}

function getDatabase(dbName)
{
	var database;
	if (!dbName) {
		database = CURRENT_DATABASE;
		if (!database) {
			throw new SQLRuntimeError('No database selected.');
		}
	} else {
		database = SERVER.databases[dbName];
		if (!database) {
			throw new SQLRuntimeError(
				'No such database "%s"',
				dbName
			);
		}
	}
	
	return database;
}

function getTable(tableName, dbName)
{			
	var database = getDatabase(dbName),
		table    = database.tables[tableName];
	if (!table) {
		throw new SQLRuntimeError(
			'No such table "%s" in database "%s"',
			tableName,
			database.name
		);
	}
	
	return table;
}

function isArray(x) 
{
	return Object.prototype.toString.call(x) == "[object Array]";
}

function isNumeric(x)
{
	var n = parseFloat(x);
	return !isNaN(n) && isFinite(n);
}

function binarySearch(haystack, needle, comparator, low, high) 
{
	var mid, cmp;

	if (low === undefined) {
    	low = 0;
	} else {
    	low = low|0;
    	if (low < 0 || low >= haystack.length)
			throw new RangeError("invalid lower bound");
	}

	if (high === undefined) {
    	high = haystack.length - 1;
	} else {
    	high = high|0;
    	if(high < low || high >= haystack.length)
			throw new RangeError("invalid upper bound");
	}

	while(low <= high) {
		/* Note that "(low + high) >>> 1" may overflow, and results in a typecast
		 * to double (which gives the wrong results). */
		mid = low + (high - low >> 1);
		cmp = +comparator(haystack[mid], needle);

		/* Too low. */
		if(cmp < 0.0) 
			low  = mid + 1;

		/* Too high. */
		else if(cmp > 0.0)
			high = mid - 1;
		
		/* Key found. */
		else
			return mid;
	}

	/* Key not found. */
	return ~low;
}

function assertType(obj, type, msg)
{
	if ( Object.prototype.toString.call(obj).toLowerCase() != "[object " + type + "]") {
		throw new TypeError(msg || "Invalid type ('" + type + "' is required)");
	}
}

function assertInstance(obj, constructor, msg)
{
	if (!(obj instanceof constructor)) {
		throw new TypeError(msg || "Invalid object type");
	}
}

function assertInBounds(val, arr, msg)
{
	if (val < 0 || val >= arr.length) {
		throw new RangeError(msg || "value out of bounds");
	}
}

function assertInObject(key, obj, msg)
{
	if ( !(key in obj) ) {
		throw new Error(msg || "No such property '" + key + "'.");
	}
}

function assert(condition, msg) {
	if (!(condition)) {
		throw new Error(msg || "Assertion failed");
	}
}

function defaultErrorHandler(e) 
{
	if (window.console && console.error) 
		console.error(e);
}

// -----------------------------------------------------------------------------
// Starts file "src/events.js"
// -----------------------------------------------------------------------------
var events = (function() {
	
	var listeners = {};

	function bind(eType, handler) 
	{
		if (!listeners[eType])
			listeners[eType] = [];
		listeners[eType].push(handler);
		return handler;
	}

	function unbind(eType, handler) 
	{
		if (!eType) {
			listeners = {};
		} else if (!handler) {
			listeners[eType] = [];
		} else {
			var a = listeners[eType] || [], l = a.length;
			while (l--) {
				if (a[l] === handler) {
					listeners[eType].splice(l, 1);
				}
			}
		}
	}

	function dispatch(e, data) 
	{
		var handlers = listeners[e] || [], 
			l = handlers.length, 
			i, 
			canceled = false;

		console.info("dispatch: ", e, data);

		for (i = 0; i < l; i++) {
			if (handlers[i](data) === false) {
				canceled = true; 
				break;
			}
		}

		return !canceled;
	}

	return {
		dispatch : dispatch,
		bind     : bind,
		unbind   : unbind
	};

})();

// -----------------------------------------------------------------------------
// Starts file "src/tokenizer.js"
// -----------------------------------------------------------------------------
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


// -----------------------------------------------------------------------------
// Starts file "src/Walker.js"
// -----------------------------------------------------------------------------
function Walker(tokens, input)
{
	this._pos = 0;
	this._tokens = tokens;
	this._input = input;
}

Walker.prototype = {
	
	/**
	 * Moves the position pointer n steps back.
	 * @param {Number} n Optional, defaults to 1.
	 * @throws {Error} on invalid argument
	 * @return {Walker} Returns the instance
	 */
	back : function(n)
	{
		n = intVal(n || 1, 1);
		if (n < 1) {
			throw new Error("Invalid argument (expecting positive integer)");
		}
		if (this._pos - n < 0) {
			throw new Error("The parser is trying go before the first token");
		}
		this._pos -= n;
		return this;
	},

	/**
	 * Moves the position pointer n steps forward.
	 * @param {Number} n Optional, defaults to 1.
	 * @throws {Error} on invalid argument
	 * @return {Walker} Returns the instance
	 */
	forward : function(n)
	{
		n = intVal(n || 1, 1);
		if (n < 1) {
			throw new Error("Invalid argument (expecting positive integer)");
		}
		if (!this._tokens[this._pos + n]) {
			throw new Error("The parser is trying go after the last token");
		}
		this._pos += n;
		return this;
	},

	/**
	 * Returns the next token. If the next token is found , the position pointer 
	 * is incremented. 
	 * @throws {Error} on invalid argument
	 * @return {Array|false} Returns the token or false past the end of the stream
	 */
	next : function()
	{
		if (!this._tokens[this._pos + 1]) {
			return false;
		}
		this._pos++;
		return this.current();
	},

	/**
	 * Returns the previous token. If the next token is found , the position 
	 * pointer is incremented. 
	 * @throws {Error} on invalid argument
	 * @return {Array|false} Returns the token or false past the end of the stream
	 */
	prev : function()
	{
		if (!this._tokens[this._pos - 1]) {
			return false;
		}
		this._pos--;
		return this.current();
	},

	/**
	 * Returns the previous token if any (undefined otherwise).
	 * @return {Array|undefined}
	 */
	current : function()
	{
		return this._tokens[this._pos];
	},

	is : function(arg, caseSensitive)
	{
		var token = this.current(),
			str   = token ? token[0] : "",
			is    = false,
			subkeys, match, start, y;


		// OR ------------------------------------------------------------------
		if (arg.indexOf("|") > 0) {
			subkeys = arg.split(/\s*\|\s*/);
			for ( y = 0; y < subkeys.length; y++ ) {
				if (this.is(subkeys[y], caseSensitive)) {
					return true;
				}
			}
			return false;
		}

		// AND -----------------------------------------------------------------
		if (arg.indexOf("&") > 0) {
			match = false;
			subkeys = arg.split(/&+/);
			for ( y = 0; y < subkeys.length; y++ ) {
				if (!this.is(subkeys[y], caseSensitive)) {
					return false;
				}
			}
			return true;
		}

		// Sequence ------------------------------------------------------------
		if (arg.indexOf(" ") > 0) {
			match = false;
			start = this._pos; 
			subkeys = arg.split(/\s+/);
			for ( y = 0; y < subkeys.length; y++ ) {
				if (!this.is(subkeys[y], caseSensitive)) {
					this._pos = start;
					return false;
				}
				this._pos++;
			}
			this._pos = start;
			return true;
		}

		// Negation ------------------------------------------------------------
		if (arg[0] == "!") {
			return !this.is(arg.substr(1));
		}

		// Token type matching -------------------------------------------------
		if (arg[0] == "@") {
			var type = intVal(arg.substr(1));
			return token ? token[1] === type : false;
		}
		
		// Case sensitive string match -----------------------------------------
		if (caseSensitive) {
			return arg === str;
		}

		// Case insensitive string match ---------------------------------------
		return arg.toUpperCase() === str.toUpperCase();
	},

	some : function(options, caseSensitive) 
	{
		var token = this._tokens[this._pos], 
			key, 
			keys = [], 
			walker = this,
			subkeys, y, prev, match;

		function onMatch() {
			match = true;
		}
		
		if (token) {
			for ( key in options ) {
				if (key.indexOf("|") > 0) {
					subkeys = key.split(/\s*\|\s*/);
					for ( y = 0; y < subkeys.length; y++ ) {
						if ((caseSensitive && subkeys[y] === token[0] ) || 
							(!caseSensitive && subkeys[y].toUpperCase() === token[0].toUpperCase())) 
						{
							this._pos++;
							options[key].call(this);
							return this;
						}
					}
				}
				else if (key.indexOf(" ") > 0) {
					match = false;
					
					this.optional(key, onMatch);

					if (match) {
						options[key].call(this);
						return this;
					}
				}
				else if ( 
					(caseSensitive && key === token[0] ) || 
					(!caseSensitive && key.toUpperCase() === token[0].toUpperCase())
				) {
					this._pos++;
					options[key].call(this);
					return this;
				}

				keys.push(key);
			}
			
			prev = "the start of the query";
			if (this._pos > 0) {
				prev = this._input.substring(0, this._tokens[this._pos][2]);
				prev = prev.substring(prev.lastIndexOf(this.lookBack(5)[0]));
				prev = prev.replace(/[\r\n]/, "").replace(/\t/, " ");
				prev = prev.replace(/\s+$/, "");
				prev = "..." + prev;
			}
			
			throw new SQLParseError(
				'Expecting: %s after "%s"', 
				prettyList(keys),
				prev
			);
		}
		return this;
	},

	any : function(options, callback, onError) 
	{
		var token = this._tokens[this._pos], len, val, i;
		if (token) {
			options = Object.prototype.toString.call(options) == "[object Array]" ? 
				options : 
				[options];
			len = options.length;
			
			for ( i = 0; i < len; i++ ) {
				val = options[i];
				if ( val.toUpperCase() === token[0].toUpperCase() ) {
					this._pos++;
					callback(token);
					return this;
				}
			}
		}
		
		if (onError)
			onError(token);
		
		throw new SQLParseError( 'Expecting: %s', prettyList(options) );
	},
	
	pick : function(options) 
	{
		return this.some(options); 
	},

	optional : function(options, callback) 
	{
		var args = arguments, start, buffer, pos, inst = this;
		
		if ( !options ) {
			return this;
		}
		
		if ( typeof options == "string" ) {
			var search = trim(options).toUpperCase().split(/\s+/), 
				ahead  = this.lookAhead(search.length), 
				i;
			
			if ( search.join(" ") === ahead.join(" ").toUpperCase() ) 
			{
				this._pos += search.length;
				callback.call(this);
			}

			// Test for partial match 
			else 
			{
				for (i = 0; i < search.length && i < ahead.length; i++) {
					if (search[i] !== ahead[i].toUpperCase()) {
						break;
					}	
				}
				if (i > 0) {
					throw new SQLParseError(
						'Expecting "%s" after "%s".', search[i], ahead[i - 1]
					);
				}
			}
		}
		
		else if (typeof options == "object") {
			
			// Array - Look for any option in any order
			if (Object.prototype.toString.call(options) == "[object Array]") {
				
				//start  = this._pos;
				every(options, function(obj, key) {
					var found = false;//console.log(obj);
					every(obj, function(fn, label) {//console.log("visited: ", label);
						start = inst._pos;
						inst.optional(label, function(tok) {
							found = true;
							inst._tokens.splice(start, inst._pos - start);
							inst._pos = start;//console.log("found: ", label);
							fn();//console.log(inst._tokens.slice(inst._pos));
							inst.optional(options);
						});
						return !found;
					});
					return !found;
				});
			} 
			
			// Object - Look for the first match
			else {
				every(options, function(fn, key) {//console.log(fn, key);
					var found = false;
					this.optional(key, function(tok) {
						found = true;
						fn();
					});
					return !found;
				}, this);
			}
		}
		
		return this;
	},
	
	someType : function(options, callback, expectation) 
	{
		var token = this._tokens[this._pos], key, type, keys = [];
		if (token) {
			for ( key in options ) {
				if ( options[key] === token[1] ) {
					this._pos++;
					callback(token);
					return this;
				}
				type = TOKEN_TYPE_MAP[options[key]];
				if (keys.indexOf(type) == -1) {
					keys.push(TOKEN_TYPE_MAP[options[key]]);
				}
			}
			throw new SQLParseError(
				'Expecting: %s %s',
				prettyList(keys),
				expectation || ""
			);
		}
		return this;
	},

	/**
	 * @param {Number} offset
	 * @return {Array}
	 */
	lookAhead : function(offset)
	{
		var out = [], 
			pos = this._pos,
			to  = pos + offset,
			token;
			
		for ( pos = this._pos; pos < to; pos++ ) {
			token = this._tokens[pos];
			if ( token ) {
				out.push( token[0] );
			}
		}

		return out;
	},

	/**
	 * Goes back the specified number of tokens, collects them and returns them
	 * in array. If the offset is greather than the current position just 
	 * returns all the tokens before the current one.
	 * @param {Number} offset
	 * @return {Array}
	 */
	lookBack : function( offset ) 
	{
		var out = [], 
			to  = this._pos - Math.abs(offset),
			pos,
			token;
		
		for ( pos = this._pos - 1; pos >= to && pos >= 0; pos-- ) {
			token = this._tokens[pos];
			if ( token ) {
				out.unshift( token[0] );
			}
		}
		
		return out;
	},
	
    /**
     * Looks forward to find a token that has value mathing the "value" 
     * parameter. If such token is found, moves the pointer right before 
     * that position. Otherwise the pointer remains the same.
     * @param {String} value The value of the searched token
     * @param {Function} callback Optional function to be called with each
     *                            skipped token. Note that this will be 
     *                            called event if the searched token is 
     *                            not found.
     * @return {Walker} Returns the instance
     */
	nextUntil : function(value, callback) { 
		var pos   = this._pos, 
			token = this._tokens[pos];

		while ( token && token[0] !== value ) {
			if (callback) {
				callback(token);
			}
			token = this._tokens[++pos];
		}
		
		if (token && token[0] === value) {
			this._pos = pos;
		}
		
		return this; 
	},
	
	errorUntil : function(value) { 
		return this.nextUntil(value, function(token) {
			throw new SQLParseError(
				'Unexpected %s "%s".', 
				TOKEN_TYPE_MAP[token[1]],
				token[0]
			);
		}); 
	},
	
	/**
	 * If the next token is ";" moves the pointer to the next position and
	 * calls the callback.
	 * @param {Function} callback The function to call if we have reached
	 *                            the ";" character.
	 * @return {Walker} Returns the instance
	 */
	commit : function(callback) { 
		var token = this._tokens[this._pos];
		if (token && token[0] == ";") {
			this._pos++;
			callback();
		}
		return this; 
	},
	
	literalValue : function(callback)
	{
		var token = this._tokens[this._pos],
			types = NUMBER_OR_STRING,
			values = [
				"NULL",
				"CURRENT_TIME",
				"CURRENT_DATE",
				"CURRENT_TIMESTAMP"
			],
			expecting = [
				"number", 
				"string", 
				"NULL",
				"CURRENT_TIME",
				"CURRENT_DATE",
				"CURRENT_TIMESTAMP"
			];
		
		if (values.indexOf(token[0]) > -1) {
			this._pos++;
			if (callback) {
				callback.call(this, token);
			}
			return this;
		}
		
		if (types.indexOf(token[1]) > -1) {
			this._pos++;
			if (callback) {
				callback.call(this, token);
			}
			return this;
		}
		
		throw new SQLParseError(
			'Unexpected %s "%s". Expecting %s.',
			TOKEN_TYPE_MAP[token[1]],
			token[0],
			prettyList(expecting)
		);
	},

	commaSeparatedList : function(itemCallback)
	{
		var token  = this._tokens[this._pos],
			walker = this;
		
		if (token[0] == ",") {
			throw new SQLParseError('Unexpected ","');
		}
		
		this._pos++;
		itemCallback.call(this, token);
		
		this.optional({ 
			"," : function(tok) {
				walker.commaSeparatedList(itemCallback);
			}
		});

		return this;
	},

	commaSeparatedBlock : function(onItem, onComplete)
	{
		var walker   = this,
			startPos = this._pos;

		this.pick({
			"(" : function() {
				var token = walker._tokens[walker._pos];
				if (token[0] == ",") {
					throw new SQLParseError('Unexpected ","');
				}

				walker.commaSeparatedList(onItem);
				
				token = walker._tokens[walker._pos++];//console.log(token[0]);

				if (token[0] != ")") {
					var prev = "";
					if (startPos > 0) {
						prev = walker._input.substring(
							walker._tokens[startPos][2], 
							walker._tokens[walker._pos][2]
						);
						prev = prev.replace(/\n/, "");
					}
					throw new SQLParseError(
						prev ? 'Expecting ")" after %s' : 'Expecting ")"',
						prev
					);
				}

				//walker.pick({
			//		")" : function() {
						if (onComplete) onComplete.call(walker);
			//		}
			//	});
			}
		});
		
		return this;
	}
};

// -----------------------------------------------------------------------------
// Starts file "src/BinaryTree.js"
// -----------------------------------------------------------------------------
function BinaryTree()
{
	this.root = null;
}

BinaryTree.prototype = {

	closestBefore : function(needle) 
	{
		var current = this.root;

		while ( current ) 
		{
			if (current.value > needle) {
				if (!current.left) 
					return null;
				current = current.left;
			}
			else if (current.value < needle) {
				if (!current.right || current.right.value >= needle) 
					return current;
				current = current.right;
			}
			else {
				return current;
			}
		}

		return current;
	},

	insert : function(node)
	{
		var closest = this.closestBefore(node.value);
		if (!closest) {
			node.right = this.root;
			node.left  = null;
			this.root  = node;

		} else {
			if (closest.right) {
				node.right = closest.right;
				closest.right.left = node;
			}
			closest.right = node;
			node.left = closest;
		}
	}
};

function BinaryTreeNode(value)
{
	this.value = value;
}

BinaryTreeNode.prototype = {
	left   : null,
	right  : null,
	parent : null,
	value  : null,

	setLeft : function(node) 
	{
		this.left = node;
	},
	setRight : function(node) 
	{
		if (this.right) {
			node.right = this.right;
			this.right.left = node;
		}
		node.left = this;
		this.right = node;

	},
	setParent : function(node) 
	{
		this.parent = node;
	},
	remove : function(node) 
	{
		this.parent = null;
	}
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/conflict-clause.js"
// -----------------------------------------------------------------------------
/**
 * Note that the entire on-conflict clause is optional
 * 
 *  »» ══╦════════════════════════════════════════════════╦══ »» 
 *		 │                                                │                     
 *		 │  ┌────┐ ┌──────────┐         ┌────────────┐    │
 *		 └──┤ ON ├─┤ CONFLICT ├────┬────┤  ROLLBACK  ├────┤
 *		    └────┘ └──────────┘    │    └────────────┘    │
 *		                           │    ┌────────────┐    │
 *		                           ├────┤    ABORT   ├────┤
 *		                           │    └────────────┘    │
 *		                           │    ┌────────────┐    │
 *		                           ├────┤    FAIL    ├────┤
 *		                           │    └────────────┘    │
 *		                           │    ┌────────────┐    │
 *		                           ├────┤   IGNORE   ├────┤
 *		                           │    └────────────┘    │
 *		                           │    ┌────────────┐    │
 *		                           └────┤   REPLACE  ├────┘
 *		                                └────────────┘
 *
 */
Walker.prototype.walkOnConflictClause = function(callback)
{
	var onConflict = null, walker = this;

	walker.optional({
		"ON CONFLICT" : function() {
			walker.pick({
				"ROLLBACK|ABORT|FAIL|IGNORE|REPLACE" : function() {
					onConflict = this.prev()[0].toUpperCase();
				}
			});
		}
	});

	if (callback) 
		callback.call(walker, onConflict);

	return walker;
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/indexed-column.js"
// -----------------------------------------------------------------------------
Walker.prototype.walkIndexedColumn = function(callback)
{
	var col    = {},
		walker = this;

	this.someType(WORD_OR_STRING, function(token) {
		col.name = token[0];
	})
	.optional({
		"COLLATE" : function() {
			walker.someType(WORD_OR_STRING, function(token) {
				col.collation = token[0];
			});
		}
	})
	.optional({
		"ASC" : function() {
			col.sortOrder = "ASC";
		},
		"DESC" : function() {
			col.sortOrder = "DESC";
		}
	});

	if (callback) callback.call(this, col);
	return this;
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/use.js"
// -----------------------------------------------------------------------------
STATEMENTS.USE = function(walker) {
	return function() {
		var dbName;
		walker.someType(WORD_OR_STRING, function(token) {
			dbName = token[0];
		})
		.errorUntil(";")
		.commit(function() {
			setCurrentDatabase(dbName);
			walker.onComplete('Database "' + dbName + '" selected.');
		});
	};
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/show_databases.js"
// -----------------------------------------------------------------------------
STATEMENTS.SHOW_DATABASES = function(walker) {
	return function() {
		walker.errorUntil(";").commit(function() {
			walker.onComplete({
				head : ["Databases"],
				rows : keys(SERVER.databases)
			});
		});
	};
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/show_tables.js"
// -----------------------------------------------------------------------------
STATEMENTS.SHOW_TABLES = function(walker) {
	return function() {
		walker.pick({
			"FROM|IN" : function() {
				var db;
				walker.someType(WORD_OR_STRING, function(token) {
					db = token[0];
				})
				.nextUntil(";")
				.commit(function() {
					var database = SERVER.databases[db];
					if (!database) {
						throw new SQLRuntimeError(
							'No such database "%s"',
							db
						);
					}
					walker.onComplete({
						head : ['Tables in database "' + db + '"'],
						rows : keys(database.tables)
					});
				});
			}
		});
	};
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/show_columns.js"
// -----------------------------------------------------------------------------
STATEMENTS.SHOW_COLUMNS = function(walker) {
	
	function getExtrasList(meta) {
		var out = [];
		if (meta.unsigned) {
			out.push("UNSIGNED");
		}
		if (meta.zerofill) {
			out.push("ZEROFILL");
		}
		if (meta.autoIncrement) {
			out.push("AUTO INCREMENT");
		}
		return out.join(", ");
	}
			
	return function() {
		var dbName, tableName;
		walker.pick({
			"FROM|IN" : function() {
				walker.someType(WORD_OR_STRING, function(token) {
					tableName = token[0];
				});
			}
		})
		.pick({
			"FROM|IN" : function() {
				walker.someType(WORD_OR_STRING, function(token) {
					dbName = token[0];
				});
			}
		})
		.nextUntil(";") // TODO: LIKE
		.commit(function() {
			var database = SERVER.databases[dbName], table;
			if (!database) {
				throw new SQLRuntimeError(
					'No such database "%s"',
					dbName
				);
			}
			
			table = database.tables[tableName];
			if (!table) {
				throw new SQLRuntimeError(
					'No such table "%s" in databse "%s"',
					tableName,
					dbName
				);
			}
			
			var result = {
				head : ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'],
				rows : []
			};
			
			each(table.cols, function(col) {
				var meta = col.toJSON(); console.log("meta: ", meta);
				result.rows.push([
					meta.name,
					col.typeToSQL(),
					meta.nullable ? "YES" : "NO",
					meta.key,
					typeof meta.defaultValue == "string" ? 
						quote(meta.defaultValue, "'") : 
						meta.defaultValue === undefined ?
							'none' : 
							meta.defaultValue,
					getExtrasList(meta)
				]);
			});	

			walker.onComplete(result);
		});
	};
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/create_database.js"
// -----------------------------------------------------------------------------
STATEMENTS.CREATE_DATABASE = function(walker) {
	return function() {
		var q = new CreateDatabaseQuery();
		walker
		.optional("IF NOT EXISTS", function() {
			q.ifNotExists(true);
		})
		.someType(WORD_OR_STRING, function(token) {
			q.name(token[0]);
		})
		.nextUntil(";")
		.commit(function() {
			q.execute();
			walker.onComplete('Database "' + q.name() + '" created.');
		});
	};
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/create_table.js"
// -----------------------------------------------------------------------------
STATEMENTS.CREATE_TABLE = function(walker) {
	
	function walk_createTable()
	{
	    var q = new CreateTableQuery();
	    
		q.temporary(walker.lookBack(2)[0].toUpperCase() == "TEMPORARY");
		
		walker
		.optional("IF NOT EXISTS", function() {
			q.ifNotExists(true);
		})
		.someType(WORD_OR_STRING, function(token) {
			q.name(token[0]);
		})
		.optional("(", function() {
			walk_createTableColumns(q);
		})
		.nextUntil(";")
		.commit(function() {
			//console.log("CreateTableQuery:");
			//console.dir(q);
			q.execute();
			walker.onComplete('Table "' + q.name() + '" created.');
		});
	}
	
	function walk_columnTypeParams(type)
	{
		walker.someType(NUMBER_OR_STRING, function(token) {
			type.params.push(token[0]);
		});
		
		walker.pick({
			"," : function() { walk_columnTypeParams(type); },
			")" : noop
		});
	}

	function walkIndexClause(index)
	{
		if (!index.name) {
			try {
				walker.someType(WORD_OR_STRING, function(token) {
					index.name = token[0];
				});
			} catch (ex) {}
		}

		walker.commaSeparatedBlock(function(token) {
			index.columns.push(token[0]);
		});
		walker.walkOnConflictClause(function(onConflict) {
			index.onConflict = onConflict;
		});
	}

	function walk_table_constraints(query) 
	{
		//console.log("walk_table_constraints");
		/*
		
	 »» ══╦══════════════════════════════════════════════════ »»
		  │  ┌───────────────────┐      
		  ├──┤        KEY        ├──┬──■ Indexed column list, ON CONFLICT
		  │  └───────────────────┘  │
		  │  ┌───────────────────┐  │
		  ├──┤       INDEX       ├──┤
		  │  └───────────────────┘  │
		  │  ┌─────────┐ ┌───────┐  │
		  ├──┤ PRIMARY ├─┤  KEY  ├──┤
		  │  └─────────┘ └───────┘  │
		  │  ┌───────────────────┐  │
		  ├──┤       UNIQUE      ├──┘
		  │  └───────────────────┘
		  │
		  │  ┌─────────┐ ┌───────┐
		  ├──┤ FOREIGN ├─┤  KEY  ├─────■ Indexed column list
		  │  └─────────┘ └───────┘
		  │  ┌─────────┐
		  └──┤  CHECK  ├───────────────■ Expression
		     └─────────┘

		*/
		var constraint = {};

		walker.optional("CONSTRAINT", function() {
			walker.someType(WORD_OR_STRING, function(token) {
				constraint.name = token[0];
			}, "for the name of the constraint");
		});
		
		walker.pick({
			"KEY|INDEX" : function() {
				constraint.type = TableIndex.TYPE_INDEX;
				constraint.columns = [];
				walkIndexClause(constraint);
			},
			"PRIMARY KEY" : function() {
				constraint.type = TableIndex.TYPE_PRIMARY;
				constraint.columns = [];
				walkIndexClause(constraint);
			},
			"UNIQUE" : function() {
				constraint.type = TableIndex.TYPE_UNIQUE;
				constraint.columns = [];
				walkIndexClause(constraint);
			},
			"CHECK" : function(token) {
				constraint.type = "CHECK";
			},
			"FOREIGN KEY" : function() {
				constraint.type = "FOREIGN KEY";
				constraint.columns = [];
				walker.commaSeparatedBlock(function(token) {
					constraint.columns.push(token[0]);
				});
			}
		});
		query.addConstraint(constraint);
		console.log("constraint: ", constraint);

		walker.optional({
			"," : function() {
				walk_table_constraints(query);
			}
		});
	}
	
	function walk_createTableColumns(q)
	{
		var col = {};
		walker.someType(WORD_OR_STRING, function(token) {//console.log(token);
			if (token[1] === TOKEN_TYPE_WORD && 
				token[0].match(/^(CONSTRAINT|KEY|PRIMARY|UNIQUE|CHECK|FOREIGN)$/i)) 
			{
				if (!q.columns.length) {
					throw new SQLParseError(
						'You have to define some table columns bore defining ' +
						'a table constraint.'
					);
				}
				walker.back();
				walk_table_constraints(q);
			} else {
				col.name = token[0];
				walker.any(DATA_TYPES, function(token) {
					var type = {
						name : token[0],
						params : []
					};
					
					walker.optional("(", function() { 
						walk_columnTypeParams(type);
					});
					
					col.type = type;
					
					walker.optional([
						{
							"NOT NULL" : function() {
								col.nullable = false;
							}, 
							"NULL" : function() {
								col.nullable = true;
							}
						},
						{
							"AUTO_INCREMENT" : function() {
								col.autoIncrement = true;
							}
						},
						{
							"KEY" : function() {
								col.key = "INDEX";
							},
							"INDEX" : function() {
								col.key = "INDEX";
							},
							"UNIQUE" : function() {
								walker.optional({ "KEY" : noop });
								col.key = "UNIQUE";
							},
							"PRIMARY KEY" : function() {
								col.key = "PRIMARY";
							}
						},
						{
							"ZEROFILL" : function() {
								col.zerofill = true;
							}
						},
						{
							"UNSIGNED" : function() {
								col.unsigned = true;
							}
						},
						{
							"DEFAULT" : function() {
								walker.someType(WORD_OR_STRING, function(token) {
									col.defaultValue = token[0];
								});
							}
						}
					]);
					
				}, function(t) {
					throw new SQLParseError( 
						'Expecting data type for column "%s" (%s).', 
						col.name,
						prettyList(DATA_TYPES) 
					);
				})
				.pick({
					"," : function() {
						q.columns.push(col);
						walk_createTableColumns(q);
					},
					")" : function() {
						q.columns.push(col);
					}
				});
			}
		});
	}
	
	return walk_createTable;
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/drop_database.js"
// -----------------------------------------------------------------------------
STATEMENTS.DROP_DATABASE = function(walker) {
	return function() {
		var q = {};
		walker.optional("IF EXISTS", function() {
			q.ifExists = true;
		})
		.someType(WORD_OR_STRING, function(token) {
			q.name = token[0];
		}, "for the database name")
		.errorUntil(";")
		.commit(function() {
			SERVER.dropDatabase(q.name, q.ifExists);
			walker.onComplete('Database "' + q.name + '" deleted.');
		});
	};
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/drop_table.js"
// -----------------------------------------------------------------------------
STATEMENTS.DROP_TABLE = function(walker) {
	var ifExists = false,
		tableName,
		dbName;
	
	return function() {
		
		walker.optional("IF EXISTS", function() {
			ifExists = true;
		})
		.someType(WORD_OR_STRING, function(token) {
			tableName = token[0];
		})
		.optional(".", function() {
			walker.someType(WORD_OR_STRING, function(token) {
				dbName = tableName;
				tableName = token[0];
			});
		})
		.optional("RESTRICT|CASCADE", function() {
			// TODO
		})
		.errorUntil(";")
		.commit(function() {
			var database, table;
			
			if (!dbName) {
				database = CURRENT_DATABASE;
				if (!database) {
					throw new SQLRuntimeError('No database selected.');
				}
			} else {
				database = SERVER.databases[dbName];
				if (!database) {
					throw new SQLRuntimeError(
						'No such database "%s"',
						dbName
					);
				}
			}
			
			table = database.tables[tableName];
			if (!table) {
				if (ifExists) {
					return walker.onComplete(
						'Table "' + database.name + '.' + tableName + '" does not exist.'
					);
				}
				
				throw new SQLRuntimeError(
					'No such table "%s" in databse "%s"',
					tableName,
					database.name
				);
			}
			
			table.drop(function() {
				walker.onComplete(
					'Table "' + database.name + '.' + table.name + '" deleted.'
				);
			}, walker.onError);
		});
	};
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/insert.js"
// -----------------------------------------------------------------------------
STATEMENTS.INSERT = function(walker) {
	var dbName, 
		tableName, 
		table,
		or, 
		valueSets = [], 
		columns;
	
	function columnsList(notFirst) {
		
		if (!notFirst) {
			columns = [];
		}
		
		walker.someType(WORD_OR_STRING, function(token) {
			columns.push(token[0]);
		})
		.pick({
			"," : function() {
				columnsList(true);
			},
			")" : noop
		});
	}
	
	function valueList(set) {
		walker.literalValue(function(token) {
			var value = token[0];
			if (token[1] === TOKEN_TYPE_WORD) {
				value = value.toUpperCase();
				if (value == "NULL") {
					value = null;
				}
			}
			set.push(value);
		})
		.optional({
			"," : function() {
				valueList(set);
			}
		});
	}
	
	function valueSet() {
		walker.pick({
			"(" : function() {
				var set = [];
				valueList(set);
				walker.pick({
					")" : function() {
						var cl = columns.length, 
							sl = set.length; 
						if (cl !== sl) {
							throw new SQLParseError(
								'The number of inserted values (%s) must ' + 
								'match the number of used columns (%s)',
								sl,
								cl
							);
						}
						valueSets.push(set);	
					}
				});
			}
		}).optional({
			"," : valueSet
		});
	}
	
	return function() {
		
		
		walker
		// TODO: with-clause
		
		// Type of insert ------------------------------------------------------
		.optional({ 
			"OR" : function() {
				walker.pick({
					"REPLACE"  : function() { or = "REPLACE" ; },
					"ROLLBACK" : function() { or = "ROLLBACK"; },
					"ABORT"    : function() { or = "ABORT"   ; },
					"FAIL"     : function() { or = "FAIL"    ; },
					"IGNORE"   : function() { or = "IGNORE"  ; },
				});
			}
		})
		
		.pick({ "INTO" : noop })
		
		// table ---------------------------------------------------------------
		.someType(WORD_OR_STRING, function(token) {
			tableName = token[0];
		})
		.optional(".", function() {
			walker.someType(WORD_OR_STRING, function(token) {
				dbName = tableName;
				tableName = token[0];
			});
		});
		
		table = getTable(tableName, dbName);
		columns = keys(table.cols);
		
		// Columns to be used --------------------------------------------------
		walker.optional({ "(" : columnsList })
		
		// Values to insert ----------------------------------------------------
		.pick({
			// TODO: Support for select statements here
			//"DEFAULT VALUES" : function() {
				// TODO
			//},
			"VALUES" : valueSet
		})
		
		// Finalize ------------------------------------------------------------
		.errorUntil(";")
		.commit(function() {
			/*console.dir({
				dbName    : dbName, 
				tableName : tableName, 
				table     : table,
				or        : or, 
				valueSets : valueSets,
				columns   : columns
			});*/
			table.insert(columns, valueSets);
			walker.onComplete(valueSets.length + ' rows inserted.');
		});
	};
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/select.js"
// -----------------------------------------------------------------------------
STATEMENTS.SELECT = function(walker) {

	/**
	 * This will match any string (in any quotes) or just a word as unquoted 
	 * name.
	 * @var string
	 */ 
	var identifier = [
		"@" + TOKEN_TYPE_WORD,
		"@" + TOKEN_TYPE_SINGLE_QUOTE_STRING,
		"@" + TOKEN_TYPE_DOUBLE_QUOTE_STRING,
		"@" + TOKEN_TYPE_BACK_TICK_STRING
	].join("|");

	/**
	 * This will match any identifier but also the "*" symbol.
	 * @var string
	 */ 
	var identifierOrAll = "*|" + identifier;

	function walkOrderBy()
	{
		if (walker.is("ORDER BY")) {
			walker.forward(2);
		}
	}

	/**
	 * Parses a table reference witch might be defined as "tableName" or 
	 * as "databaseName.tableName". This function does NOT try to evaluate the
	 * result to real Table object. Instead it just returns an object with 
	 * "table" and "database" properties (the "database" will be null if not 
	 * defined). 
	 * @return {Object}
	 * @throws {SQLParseError} if the input cannot be parsed correctly
	 */
	function tableRef(tables) 
	{
		var out = {
			database : null, 
			table    : null,
			alias    : null
		};

		walker.someType(WORD_OR_STRING, function(token) {
			out.table = token[0];
		}, "for table name")
		.optional(".", function() {
			walker.someType(WORD_OR_STRING, function(token) {
				out.database = out.table;
				out.table    = token[0];
			}, "for database name");
		});

		if (walker.is(identifier)) {
			if (walker.is("AS")) {
				walker.forward();
				walker.someType(WORD_OR_STRING, function(tok) {
					out.alias = tok[0];
				}, "for table alias");
			}
			else if (walker.is("WHERE|GROUP|ORDER|LIMIT")) {
				
			}
			else {
				out.alias = walker.current()[0];
				walker.forward();
			}
		}

		tables.push(out);

		return out;
	}

	/**
	 * Parses a table field reference witch might be defined as "fieldName" or 
	 * as "tableName.fieldName", or as "databaseName.tableName.fieldName". This 
	 * function does NOT try to evaluate the result to real field object. 
	 * Instead it just returns an object with "field", "table" and "database" 
	 * properties (the "database" and "table" will be null if not defined). 
	 * @return {Object}
	 * @throws {SQLParseError} if the input cannot be parsed correctly
	 */
	function fieldRef(fields) 
	{
		var out = {
			database : null, 
			table    : null,
			field    : null,
			alias    : null
		};

		if (walker.is(identifierOrAll)) {
			out.field = walker.current()[0];
			walker.forward();
			if (walker.is(".")) {
				walker.forward();
				if (walker.is(identifierOrAll)) {
					out.table = out.field;
					out.field = walker.current()[0];
					if (walker.forward().is(".")) {
						if (walker.forward().is(identifierOrAll)) {
							out.database = out.table;
							out.table    = out.field;
							out.field    = walker.current()[0];
						} else {
							walker.prev();
						}
					} else {
						walker.prev();
					}
				} else {
					walker.prev();
				}
			}
		}

		// now check what we have so far
		if (!out.field) {
			throw new SQLParseError('Expecting a field name');
		}
		if (out.table == "*") {
			throw new SQLParseError('You cannot use "*" as table name');
		}
		if (out.database == "*") {
			throw new SQLParseError('You cannot use "*" as database name');
		}

		fields.push(out);

		// now check for an alias or just continue
		if (walker.is(identifier)) { 
			if (walker.is("AS")) {
				walker.forward();
				walker.someType(WORD_OR_STRING, function(tok) {
					out.alias = tok[0];
				});
			}
			else if (walker.is("FROM|WHERE|GROUP|ORDER|LIMIT")) {
				
			}
			else {
				out.alias = walker.current()[0];
				walker.forward();
			}
		}

		if (walker.is(",")) {
			walker.forward();
			fieldRef(fields);
		}
	}

	function execute(query)
	{
		var rows   = [],
			tables = {},
			tablesLength = query.tables.length,
			tableIndex,
			table,
			rowId,
			i;

		for ( i = 0; i < tablesLength; i++ ) 
		{
			tables[i] = tables[query.tables[i].table] = getTable(
				query.tables[i].table,
				query.tables[i].database
			);

			if (query.tables[i].alias) {
				tables[query.tables[i].alias] = tables[i];
			}
		}

		for ( tableIndex = 0; tableIndex < tablesLength; tableIndex++ )
		{
			table = tables[tableIndex];
			for (rowId in table.rows)
			{
				rows.push(table.rows[rowId].toArray());
			}
		}

		console.log("tables: ", tables, rows);
		return rows;
	}

	return function() {
		
		var query = {
			fields : [],
			tables : []
		};

		fieldRef(query.fields);

		
		//console.log("current: ", walker.current()[0]);
		walker.pick({
			"FROM" : function() {//console.log("current: ", walker.current()[0]);
				tableRef(query.tables);
			}
		});

		if (walker.is("ORDER BY")) {

		}
		//console.log("query: ", query);
		
		// table -------------------------------------------------------
		var //tbl   = tableRef(),
			table = getTable(query.tables[0].table, query.tables[0].database);
		
		walker.errorUntil(";")
		.commit(function() {
			//execute(query);
			console.log("query: ", query);

			walker.onComplete({
				head : table._col_seq,
				rows : execute(query)//table.rows
			});
		});
	};
};

// -----------------------------------------------------------------------------
// Starts file "src/parser.js"
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                               SQL Parser                                   //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
function SQLParseError(message)
{
	this.name    = "SQLParseError";
	this.message = strf.apply(
		this, 
		arguments.length ? arguments : ["Error while parsing sql query"]
	);
}

SQLParseError.prototype = new Error();
SQLParseError.prototype.constructor = SQLParseError;

function SQLRuntimeError(message)
{
	this.name    = "SQLRuntimeError";
	this.message = strf.apply(
		this, 
		arguments.length ? arguments : ["Error while executing sql query"]
	);
}

SQLParseError.prototype = new Error();
SQLParseError.prototype.constructor = SQLParseError;



function Parser(onComplete, onError)
{
	var parser = this,
		env    = {},
		tokens;

	function parse2(tokens, input) {
		var walker = new Walker(tokens, input),
			queryNum = 1;

		walker.onComplete = function(result) {
			if (walker.current()) {
				queryNum++;
				start();
			} else {
				if (onComplete) 
					onComplete(
						queryNum > 1 ? 
							queryNum + ' queries executed successfully.' :
							result
					);
			}
		};

		walker.onError = onError || defaultErrorHandler;

		function start() 
		{
			walker.pick({
				"USE" : STATEMENTS.USE(walker),
				"SHOW" : function() {
					walker.pick({
						"DATABASES|SCHEMAS" : STATEMENTS.SHOW_DATABASES(walker),
						"TABLES"            : STATEMENTS.SHOW_TABLES(walker),
						"COLUMNS"           : STATEMENTS.SHOW_COLUMNS(walker)
					});
				},
				"CREATE" : function() {
					walker.pick({
						"DATABASE|SCHEMA" : STATEMENTS.CREATE_DATABASE(walker),
						"TABLE"           : STATEMENTS.CREATE_TABLE(walker),
						"TEMPORARY TABLE" : STATEMENTS.CREATE_TABLE(walker),
					});
				},
				"DROP" : function() {
					walker.pick({
						"DATABASE|SCHEMA" : STATEMENTS.DROP_DATABASE(walker),
						"TABLE"           : STATEMENTS.DROP_TABLE(walker),
						"TEMPORARY TABLE" : STATEMENTS.DROP_TABLE(walker)
					});
				},
				"INSERT" : STATEMENTS.INSERT(walker),
				"SELECT" : STATEMENTS.SELECT(walker)
			});
		}

		start();
	}

	this.parse = function(input) {
		tokens = getTokens(input,
		{
			skipComments : true,
			skipSpace    : true,
			skipEol      : true,
			//addEOF       : true,
			skipStrQuots : true
		});
		return parse2(tokens, input);
	};
}

function parse( sql )
{
	var parser = new Parser();
	return parser.parse(sql);
}

// -----------------------------------------------------------------------------
// Starts file "src/storage/StorageBase.js"
// -----------------------------------------------------------------------------

var Storage = (function() {
	var engines = {},
		engineInstances = {};
	
	return {
		getEngine : function(name) {
			if (!engineInstances[name]) {
				engineInstances[name] = new engines[name]();
			}
			return engineInstances[name];
		},
		registerEngine : function(name, constructor) {
			if (engines[name])
				throw new Error(
					'Storage engine "' + name + '" is already registered.'
				);
			engines[name] = constructor;
		},
		getEnginePrototype : function() {
			return {
				set : function(key, value, onSuccess, onError) 
				{
					onError("Failed to save - not implemented.");
				},
				get : function(key, onSuccess, onError) 
				{
					onError("Failed to read - not implemented.");
				},
				unset : function(key, onSuccess, onError) 
				{
					onError("Failed to delete - not implemented.");
				},
				setMany : function(map, onSuccess, onError)
				{
					onError("Failed to save - not implemented.");
				},
				getMany : function(keys, onSuccess, onError)
				{
					onError("Failed to read - not implemented.");
				},
				unsetMany : function(keys, onSuccess, onError)
				{
					onError("Failed to delete - not implemented.");
				}
			};
		}
	};
})();


// -----------------------------------------------------------------------------
// Starts file "src/storage/LocalStorage.js"
// -----------------------------------------------------------------------------
/**
 * Class LocalStorage extends LocalStorage
 */
function LocalStorage() 
{
	this.setMany = function(map, onSuccess, onError)
	{
		setTimeout(function() {
			try {
				for ( var key in map )
					localStorage.setItem( key, map[key] );
				if (onSuccess) 
						onSuccess();
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};

	this.getMany = function(keys, onSuccess, onError)
	{
		setTimeout(function() {
			try {
				var out = [];
				for (var i = 0, l = keys.length; i < l; i++)
					out.push( localStorage.getItem( keys[i] ) );
				if (onSuccess) 
					onSuccess( out );
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};

	this.unsetMany = function(keys, onSuccess, onError)
	{
		setTimeout(function() {
			try {
				for (var i = 0, l = keys.length; i < l; i++)
					localStorage.removeItem( keys[i] );
				if (onSuccess) 
					onSuccess();
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};

	this.set = function(key, value, onSuccess, onError) 
	{
		setTimeout(function() {
			try {
				localStorage.setItem( key, value );
				if (onSuccess)
					onSuccess();
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};
	
	this.get = function(key, onSuccess, onError) 
	{
		setTimeout(function() {
			try {
				if (onSuccess)
					onSuccess(localStorage.getItem( key ));
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};
	
	this.unset = function(key, onSuccess, onError) 
	{
		setTimeout(function() {
			try {
				localStorage.removeItem( key );
				if (onSuccess)
					onSuccess();
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};
}
LocalStorage.prototype = Storage.getEnginePrototype();
LocalStorage.prototype.constructor = LocalStorage;
Storage.registerEngine("LocalStorage", LocalStorage);


// -----------------------------------------------------------------------------
// Starts file "src/storage/MemoryStorage.js"
// -----------------------------------------------------------------------------
/**
 * Class MemoryStorage extends StorageBase
 */
function MemoryStorage() {
	var _store = {};

	this.setMany = function(map, onSuccess, onError)
	{
		setTimeout(function() {
			try {
				for ( var key in map )
					_store[key] = map[key];
				if (onSuccess) 
						onSuccess();
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};

	this.getMany = function(keys, onSuccess, onError)
	{
		setTimeout(function() {
			try {
				var out = [];
				for (var i = 0, l = keys.length; i < l; i++)
					out.push( _store[keys[i]] );
				if (onSuccess) 
					onSuccess( out );
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};

	this.unsetMany = function(keys, onSuccess, onError)
	{
		setTimeout(function() {
			try {
				for (var i = 0, l = keys.length; i < l; i++)
					if (_store.hasOwnProperty(keys[i])) 
						delete _store[keys[i]];
				if (onSuccess) 
					onSuccess();
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};
	
	this.set = function(key, value, onSuccess, onError) 
	{
		setTimeout(function() {
			try {
				_store[key] = val;
				if (onSuccess) 
					onSuccess();
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};
	
	this.get = function(key, onSuccess, onError) 
	{
		setTimeout(function() {
			try {
				if (onSuccess) 
					onSuccess( _store[key] );
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};
	
	this.unset = function(key, onSuccess, onError) 
	{
		setTimeout(function() {
			try {
				if (_store.hasOwnProperty(key)) 
					delete _store[key];
				if (onSuccess) 
					onSuccess();
			} catch (ex) {
				(onError || defaultErrorHandler)(ex);
			}
		}, 0);
	};
}

MemoryStorage.prototype = Storage.getEnginePrototype();
MemoryStorage.prototype.constructor = MemoryStorage;
Storage.registerEngine("MemoryStorage", MemoryStorage);


// -----------------------------------------------------------------------------
// Starts file "src/Persistable.js"
// -----------------------------------------------------------------------------
function Persistable() {}

Persistable.prototype = {
	
	storage : Storage.getEngine("LocalStorage"),
	
	toJSON : function() 
	{
		return {};
	},
	
	getStorageKey : function()
	{
		throw "Please implement the 'getStorageKey' method to return the " + 
			"storage key";
	},
	
	read : function(onSuccess, onError)
	{
		this.storage.get(this.getStorageKey(), function(data) {
			try {
				var result = JSON.parse(data);
				onSuccess(result);
			} catch (ex) {
				onError(ex);
			}
		}, onError);
	},
	
	write : function(data, onSuccess, onError)
	{
		this.storage.set(
			this.getStorageKey(), 
			JSON.stringify(data), 
			onSuccess, 
			onError 
		);
	},
	
	drop : function(onSuccess, onError)
	{
		this.storage.unset(this.getStorageKey(), onSuccess, onError);
	},
	
	save : function(onSuccess, onError) 
	{
		this.write( this.toJSON(), onSuccess, onError );
	},
	
	load : function(onSuccess, onError)
	{
		this.read(onSuccess, onError);
	}
};



// -----------------------------------------------------------------------------
// Starts file "src/Server.js"
// -----------------------------------------------------------------------------

function Server()
{
	this.databases = {};
}

Server.prototype = new Persistable();
Server.prototype.constructor = Server;

Server.prototype.getStorageKey = function()
{
	return NS;
};

Server.prototype.toJSON = function()
{
	var json = { databases : {} };
	for ( var name in this.databases ) {
		json.databases[name] = this.databases[name].getStorageKey();
	}
	return json;
};

Server.prototype.load = function(onSuccess, onError)
{
	var inst = this;
	JSDB.events.dispatch("loadstart:server", inst);
	this.read(
		function(json) {
			if (!json) {
				JSDB.events.dispatch("load:server", inst);
				onSuccess.call(inst);
				return;
			}

			var databases = [], dbName, dbCount = 0, db, i = 0, loaded = 0;
			
			function onDatabaseLoad(db)
			{
				return function()
				{
					inst.databases[db.name] = db;
					if (++loaded === dbCount) {
						JSDB.events.dispatch("load:server", inst);
						onSuccess.call(inst);
					}
				};
			}

			// Clear current databases (if any)
			inst.databases = {};


			for ( dbName in json.databases ) {
				db = new Database(dbName);
				databases[dbCount++] = db;
			}

			for ( i = 0; i < dbCount; i++ ) {
				db = databases[i];
				db.load(onDatabaseLoad(db), onError);
			}

			//inst.save();
		},
		onError
	);
	//var json = this.read(), db, meta;
	//if (json) {
	//	this.databases = {};
	//	for ( var name in json.databases ) {
	//		db = new Database(name);
	//		db.load();
	//		this.databases[name] = db;
	//	}
	//	this.save();
	//}
	return this;
};

/**
 * Creates and returns new Database
 * @param {String} name The name of the database to create
 * @param {Boolean} ifNotExists Note that an exception will be thrown if such 
 * database exists and this is not set to true.
 * @return void
 */
Server.prototype.createDatabase = function(name, ifNotExists) 
{
	if (typeof name != "string") {
		throw new SQLRuntimeError("Invalid database name");
	}

	if (!name) {
		throw new SQLRuntimeError("No database name");
	}

	if (this.databases.hasOwnProperty(name)) {
		if (!ifNotExists) {
			throw new SQLRuntimeError('Database "' + name + '" already exists');
		}
		return this.databases[name];
	}

	var db = new Database(name);
	db.save();
	this.databases[name] = db;
	this.save();
	return db;
};

Server.prototype.dropDatabase = function(name, ifExists) 
{
	if (this.databases.hasOwnProperty(name)) {
		this.databases[name].drop();
		delete this.databases[name];
		this.save();
	} else {
		if (!ifExists) {
			throw new SQLRuntimeError('Database "' + name + '" does not exist');
		}
	}
};


// -----------------------------------------------------------------------------
// Starts file "src/Database.js"
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                             Class Database                                 //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
function Database(name) 
{
	this.tables = {};
	this.name = name;
}

Database.prototype = new Persistable();
Database.prototype.constructor = Database;

Database.prototype.toJSON = function() 
{
	var out = { name : this.name, tables : {} }, t;
	for (t in this.tables) {
		out.tables[t] = [NS, this.name, t].join(".");
	}
	return out;
};

Database.prototype.getStorageKey = function() 
{
	return NS + "." + this.name;
};

Database.prototype.drop = function()
{
	for ( var tableName in this.tables ) {//debugger; 
		this.tables[tableName].drop();
	}
	Persistable.prototype.drop.call(this);
};

Database.prototype.load = function(onSuccess, onError) 
{
	var db = this;
	JSDB.events.dispatch("loadstart:database", db);
	db.read(function(json) {
		var table, 
			tables = [], 
			tableName,
			loaded = 0, 
			tableCount = 0, i;

		function onTableLoad(table)
		{
			return function()
			{
				db.tables[table.name] = table;
				if (++loaded === tableCount) {
					JSDB.events.dispatch("load:database", db);
					if (onSuccess) onSuccess(db);
				}
			};
		}

		db.tables = {};

		for ( var name in json.tables ) {
			table = new Table(name, db);
			tables[tableCount++] = table;
		}

		if (tableCount) {
			for ( i = 0; i < tableCount; i++ ) {
				table = tables[i];
				table.load(onTableLoad(table), onError);
			}
		} else {
			JSDB.events.dispatch("load:database", db);
			if (onSuccess) onSuccess(db);
		}

	}, onError);
	
	return db;
};

Database.prototype.save = function(onComplete, onError) 
{
	Persistable.prototype.save.call(this, function() {
		SERVER.save(onComplete, onError);
	}, onError);
	return this;
};

Database.prototype.createTable = function(name, fields, ifNotExists)
{
	if (this.tables.hasOwnProperty(name)) {
		if (!ifNotExists) {
			throw new SQLRuntimeError('Table "%s" already exists', name);
		}
	}

	var table = new Table(name, this), col;
	for (col = 0; col < fields.length; col++) {
		table.addColumn(fields[col]);
	}
	
	table.save();
	this.tables[name] = table;
	this.save();
	return table;
};


// -----------------------------------------------------------------------------
// Starts file "src/Table.js"
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                              Class Table                                   //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
/*
{ 
	databses : {
		db1 : {
			tables : {
				table1 : {
					name : "table1",
					_length  : 5,
					_ai      : 6,
					_col_seq : ["id", "name"],
					_row_seq : [1, 2, 3, 4, 5],
					cols : {
						id   : {},
						name : {}
					},
					keys : {
						PRIMARY    : [1, 2, 3, 4, 5],
						name_index : [5, 2, 1, 4, 3]
					},
					rows : {
						1 : [1, "Vladimir"], // JSDB.db1.table1.1
						2 : [2, "Nikolai" ], // JSDB.db1.table1.2
						3 : [3, "Arjun"   ], // JSDB.db1.table1.3
						4 : [4, "Vasil"   ], // JSDB.db1.table1.4
						5 : [5, "Iva"     ], // JSDB.db1.table1.5
					}
				}
			}
		}
	}
}*/

function Table(tableName, db) 
{
	/**
	 * The name of the table
	 * @var String
	 */
	this.name = tableName;
	
	/**
	 * Collection of TableRow instances by sequence
	 * @var Object
	 */
	this.rows = {};

	/**
	 * The indexes of the table
	 * @var Object
	 */
	this.keys = {};

	/**
	 * Collection of Column instances by name
	 * @var Object
	 */
	this.cols = {};
	
	this._col_seq = [];
	this._row_seq = [];
	this._length  = 0;
	this._ai      = 1;
	this._db      = db;
}

Table.prototype = new Persistable();
Table.prototype.constructor = Table;

Table.prototype.createIndex = function(options) 
{
	var name;
	assertType(options, "object", "Invalid argument for Table.createIndex");
	assertType(options.name, "string", "Invalid index name");
	name = trim(options.name);
	assert(name, "Index name is required");
	assert(!this.keys.hasOwnProperty(name), 'Index "%s" already exists');

	this.keys[name] = {
		index      : [],
		columns    : [],
		onConflict : null
	};
};

Table.prototype.toJSON = function() 
{
	var json = {
		name    : this.name,
		columns : {},
		rows    : {},
		keys    : {}
	};
	for (var name in this.cols) {
		json.columns[name] = this.cols[name].toJSON();
	}
	for ( name in this.rows) {
		//json.rows[name] = this.rows[name].toArray();
		json.rows[name] = this.rows[name].getStorageKey();
	}
	for ( name in this.keys ) {
		json.keys[name] = this.keys[name].toJSON();
	}
	return json;
};

Table.prototype.getStorageKey = function() 
{
	return [NS, this._db.name, this.name].join(".");
};

Table.prototype.addConstraint = function(props)
{
	if (props.type == TableIndex.TYPE_INDEX ||
		props.type == TableIndex.TYPE_UNIQUE ||
		props.type == TableIndex.TYPE_PRIMARY) 
	{
		var key = TableIndex.fromJSON(props, this);
		this.keys[key.name] = key;
	}
};

Table.prototype.addColumn = function(props)
{//console.log("Table.prototype.addColumn: ", props);
	var col = Column.create(props);
	
	switch ( col.key ) {
		case "PRIMARY":
			//if ( "PRIMARY" in this.keys ) {
			//	throw new SQLRuntimeError(
			//		'A table can only have one PRIMARY KEY'
			//	);
			//}
			//this.keys.PRIMARY = 
			this.keys[ col.name ] = new TableIndex(
				this, 
				[ col.name ], 
				TableIndex.TYPE_PRIMARY, 
				col.name
			);
		break;
		case "UNIQUE":
			this.keys[ col.name ] = new TableIndex(
				this, 
				[ col.name ], 
				TableIndex.TYPE_UNIQUE, 
				col.name
			);
		break;
		case "KEY":
		case "INDEX":
			this.keys[ col.name ] = new TableIndex(
				this, 
				[ col.name ], 
				TableIndex.TYPE_INDEX, 
				col.name
			);
		break;
	}

	this.cols[props.name] = col;
	this._col_seq.push(props.name);
	
	if (col.key) {
		// TODO: Add index
	}
	return col;
};

Table.prototype.save = function(onComplete, onError) 
{
	var db = this._db;
	Persistable.prototype.save.call(this, function() {
		db.save(onComplete, onError);	
	}, onError);
	return this;
};

Table.prototype.load = function(onComplete, onError) 
{
	var table = this;
	JSDB.events.dispatch("loadstart:table", table);
	table.read(function(json) {
		var colCount = 0, 
			name;

		function onRowLoad(row) {
			for (var ki in table.keys) {
				table.keys[ki].beforeInsert(row);
			}
			table._ai = Math.max(table._ai, row.id) + 1;
			table.rows[row.id] = row;
			table._length++;
			table._row_seq.push(row.id);
			if (--colCount === 0) {
				JSDB.events.dispatch("load:table", table);
				if (onComplete) onComplete(table);
			}
		}

		if (json) {
			table.cols = {};
			table.rows = {};
			table.keys = {};
			
			// Create columns
			for ( name in json.columns ) {//console.log(name, json.columns[name]);
				table.addColumn(json.columns[name]);
			}

			// Create indexes
			if (json.keys) {
				table.keys = {};
				table.primaryKey = null;
				for ( name in json.keys ) {
					table.keys[name] = TableIndex.fromJSON(json.keys[name], table);
				}
			}
			
			// Create rows
			for ( var key in json.rows ) {//console.log(name, json.columns[name]);
				//table.addColumn(json.columns[name]);
				table.rows[key] = new TableRow(table, key);
				colCount++;
			}

			// Load rows data
			if (colCount) {
				for ( key in table.rows ) {
					table.rows[key].load(onRowLoad, onError);
				}
			} else {
				JSDB.events.dispatch("load:table", table);
				if (onComplete) onComplete(table);
			}


			
			//this.save();
		}
	}, onError);
};

Table.prototype.insert = function(keys, values) 
{
	

	var kl = keys.length,
		rl = values.length,
		cl = this._col_seq.length,
		ki, // user key index 
		ri, // user row index
		ci, // table column index
		row, 
		col, 
		key;

	// for each input row
	for (ri = 0; ri < rl; ri++) {
		row = new TableRow(this, this._ai);
		
		// for each user-specified column
		for (ki = 0; ki < kl; ki++) {
			row.setCellValue(keys[ki], values[ri][ki]);
		}

		for (ki in this.keys) {
			this.keys[ki].beforeInsert(row);
		}
		
		this.rows[this._ai++] = row;
		this._length++;
		this._row_seq.push(this._ai - 1);
		row.save();
	}

	this.save();

	//console.dir(this.toJSON());
};

Table.prototype.drop = function(onComplete, onError) 
{
	var table     = this, 
		keyPrefix = table.getStorageKey(),
		rowIds    = [],
		id;

	if (JSDB.events.dispatch("before_delete:table", table)) {
		for ( id in table.rows ) {
			rowIds.push(keyPrefix + "." + id);
		}

		
		table.storage.unsetMany(rowIds, function() {
			Persistable.prototype.drop.call(table, function() {
				delete table._db.tables[table.name];
				table._db.save(function() {
					JSDB.events.dispatch("after_delete:table", table);
					if (onComplete) 
						onComplete();
				}, onError);
			}, onError);
		}, onError);
	}
};


// -----------------------------------------------------------------------------
// Starts file "src/Column.js"
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                              Class Column                                  //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
var columnDataTypes = {
	"BIT"       : Column_BIT      , // [(length)]
	"TINYINT"   : Column_TINYINT  , // [(length)] [UNSIGNED] [ZEROFILL]
	"SMALLINT"  : Column_SMALLINT , // [(length)] [UNSIGNED] [ZEROFILL]
	"MEDIUMINT" : Column_MEDIUMINT, // [(length)] [UNSIGNED] [ZEROFILL]
	"INT"       : Column_INT      , // [(length)] [UNSIGNED] [ZEROFILL]
	"INTEGER"   : Column_INTEGER  , // [(length)] [UNSIGNED] [ZEROFILL]
	"BIGINT"    : Column_BIGINT   , // [(length)] [UNSIGNED] [ZEROFILL]
	//"REAL"      : , // [(length,decimals)] [UNSIGNED] [ZEROFILL]
	"DOUBLE"    : Column_DOUBLE   , // [(length,decimals)] [UNSIGNED] [ZEROFILL]
	"FLOAT"     : Column_FLOAT    , // [(length,decimals)] [UNSIGNED] [ZEROFILL]
	"DECIMAL"   : Column_DECIMAL  , // [(length[,decimals])] [UNSIGNED] [ZEROFILL]
	"NUMERIC"   : Column_NUMERIC  , // [(length[,decimals])] [UNSIGNED] [ZEROFILL]
	//"DATE" : {},
	//"TIME" : {}, // [(fsp)]
	//"TIMESTAMP" : {}, // [(fsp)]
	//"DATETIME" : {}, // [(fsp)]
	//"YEAR" : {},
	"CHAR"      : Column_CHAR   , // [(length)] [CHARACTER SET charset_name] [COLLATE collation_name]
	"VARCHAR"   : Column_VARCHAR, // (length) [CHARACTER SET charset_name] [COLLATE collation_name]
	//"BINARY" : {}, // [(length)]
	//"VARBINARY" : {}, //(length)
	//"TINYBLOB" : {},
	//"BLOB" : {},
	//"MEDIUMBLOB" : {},
	//"LONGBLOB" : {},
	//"TINYTEXT" : {}, // [BINARY] [CHARACTER SET charset_name] [COLLATE collation_name]
	//"TEXT" : {}, //  [BINARY] [CHARACTER SET charset_name] [COLLATE collation_name]
	//"MEDIUMTEXT" : {}, //  [BINARY][CHARACTER SET charset_name] [COLLATE collation_name]
	//"LONGTEXT" : {}, //  [BINARY][CHARACTER SET charset_name] [COLLATE collation_name]
	//"ENUM" : {}, // (value1,value2,value3,...)[CHARACTER SET charset_name] [COLLATE collation_name]
	//"SET" : {}//, // (value1,value2,value3,...)[CHARACTER SET charset_name] [COLLATE collation_name]
	//"spatial_type"
};


function Column() {}

Column.constructors = columnDataTypes;

Column.prototype = {
	length : -1,
	name   : null,
	type   : null,
	nullable : false,
	typeParams : [],
	setName : function(name)
	{
		if (name) {
			name = trim(name);
			if (name) {
				this.name = name;
				return this;
			}
		}
		
		throw new SQLRuntimeError('Invalid column name "%s".', name);
	},
	setKey : function(key) {
		key = String(key).toUpperCase();
		if (key == "KEY" || key == "INDEX" || key == "UNIQUE" || key == "PRIMARY") {
			this.key = key;
		} else {
			this.key = undefined;
		}
	},
	setDefaultValue : function(val) {//if (val == 43) debugger; 
		this.defaultValue = val === undefined ? val : this.set(val);
	},

	init : function(options) 
	{
		this.setName(options.name);
		this.setKey(options.key);
		this.setDefaultValue(options.defaultValue);
		this.nullable = !!options.nullable;
		return this;
	},

	toJSON : function() {
		var json = {
			name : this.name,
			key      : this.key,
			defaultValue : this.defaultValue,
			nullable : !!this.nullable,
			type : {
				name : this.type,
				params : [this.length]
			}
		};
		
		return json;
	},
	typeToSQL : function() {
		var sql = [this.type];
		if (this.typeParams.length) {
			sql.push(
				"(",
				this.typeParams.join(", "),
				")"
			);
		}
		return sql.join("");
	}
};

Column.create = function(options)
{
	var type = options.type.name.toUpperCase(),
		Func = columnDataTypes[type], 
		inst;
		
	if (!Func) {
		throw new SQLRuntimeError(
			'Unknown data type "%s".',
			options.type.name
		);
	}
	
	inst = new Func();
	inst.init.call(inst, options);
	//inst.typeParams = options.type.params || [];
	return inst;
};

////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                           NUMERIC COLUMNS                                  //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////

// NumericColumn extends Column
// =============================================================================
function NumericColumn() {}
NumericColumn.prototype               = new Column();
NumericColumn.prototype.constructor   = NumericColumn;
NumericColumn.prototype.unsigned      = false;
NumericColumn.prototype.zerofill      = false;
NumericColumn.prototype.autoIncrement = false;
NumericColumn.prototype.minUnsigned   =  0;
NumericColumn.prototype.minSigned     = -1;
NumericColumn.prototype.maxUnsigned   =  2;
NumericColumn.prototype.maxSigned     =  1;
NumericColumn.prototype.max           =  1;
NumericColumn.prototype.min           = -1;

NumericColumn.prototype.init = function(options) 
{
	this.setUnsigned(options.unsigned);
	
	if ( isArray(options.type.params) && options.type.params.length > 0 ) {
		this.setLength(options.type.params[0]);
		this.typeParams = [this.length];	
	} else {
		//this.setLength(options.length === undefined ? 1 : options.length );	
	}
	
	this.setAutoIncrement(options.autoIncrement);
	this.zerofill = !!options.zerofill;
	Column.prototype.init.call(this, options);
};

NumericColumn.prototype.setAutoIncrement = function(bOn)
{
	this.autoIncrement = !!bOn;
};

NumericColumn.prototype.setUnsigned = function(bUnsigned)
{
	this.unsigned = !!bUnsigned;
	this.min = this.unsigned ? this.minUnsigned : this.minSigned;
	this.max = this.unsigned ? this.maxUnsigned : this.maxSigned; 
};

NumericColumn.prototype.setLength = function(n) 
{
	var l = String(this.max).length;
	n = parseInt(n, 10);
	if (isNaN(n) || !isFinite(n) || n < 1 || n > l ) {
		throw new SQLRuntimeError(
			'Invalid length for column "%s". The length must be between 1 ' + 
			'and %s inclusive.',
			this.name,
			l
		);
	}
	this.length = n;
};

NumericColumn.prototype.toJSON = function() {
	var json = {
		name         : this.name,
		unsigned     : this.unsigned,
		zerofill     : this.zerofill,
		key          : this.key,
		defaultValue : this.defaultValue === undefined ? this.defaultValue : String(this.defaultValue),
		autoIncrement: this.autoIncrement,
		nullable     : this.nullable,
		type : {
			name   : this.type,
			params : this.typeParams.slice()
		}
	};
	
	return json;
};

NumericColumn.prototype.toSQL = function() 
{
	var sql = [
		quote(this.name), 
		this.typeToSQL(),
		this.nullable ? "NULL" : "NOT NULL"
	];

	if (this.unsigned)
		sql.push("UNSIGNED");
	if (this.zerofill)
		sql.push("ZEROFILL");
	if (this.autoIncrement)
		sql.push("AUTO_INCREMENT");

	if (this.key == "PRIMARY")
		sql.push("PRIMARY KEY");
	else if (this.key == "UNIQUE")
		sql.push("UNIQUE");
	else if (this.key == "INDEX")
		sql.push("KEY");

	if (this.defaultValue !== undefined) {
		sql.push(
			"DEFAULT",
			//typeof this.defaultValue == "string" ? 
				quote(this.defaultValue, "'") //: 
			//	this.defaultValue
		);
	}

	return sql.join(" ");
};

// Column_BIT
// =============================================================================

/**
 * The BIT data type is used to store bit-field values. A type of BIT(M) 
 * enables storage of M-bit values. M can range from 1 to 64.
 * To specify bit values, b'value' notation can be used. value is a binary 
 * value written using zeros and ones. For example, b'111' and b'10000000' 
 * represent 7 and 128, respectively. 
 * If you assign a value to a BIT(M) column that is less than M bits long, 
 * the value is padded on the left with zeros. For example, assigning a 
 * value of b'101' to a BIT(6) column is, in effect, the same as assigning 
 * b'000101'.
 */
function Column_BIT() {}
Column_BIT.prototype             = new NumericColumn();
Column_BIT.prototype.constructor = Column_BIT;
Column_BIT.prototype.type        = "BIT";

Column_BIT.prototype.init = function(options) 
{
	NumericColumn.prototype.init.call(this, options);

	if ( isArray(options.type.params) && options.type.params.length > 0) {
		if (options.type.params.length !== 1) {
			throw new SQLRuntimeError(
				'Invalid data type declaration for column "%s". The syntax ' + 
				'is "INT[(length)]".',
				options.name
			);
		}
		this.setLength(options.type.params[0]);
		this.typeParams = [this.length];	
	}
};

Column_BIT.prototype.setLength = function(n) 
{
	n = parseInt(n, 10);
	if (isNaN(n) || !isFinite(n) || n < 1 || n > 64 ) {
		throw new SQLRuntimeError(
			'Invalid length for column "%s". The length must be between 1 ' + 
			'and 64 inclusive.',
			this.name
		);
	}
	this.length = n;
};

Column_BIT.prototype.set = function(value) {
	var v = String(value), l = v.length, n;
	
	if (l > this.length) {
		throw new SQLRuntimeError(
			'The data ("%s") is too long for the field "%s". It may contain ' +
			'up to %s bits',
			v,
			this.name,
			this.length
		);
	}
	
	n = parseInt(v, 2);

	//if (isNaN(n) && isNumeric(v)) {
	//	n = parseInt(v, 10);
	//}
	
	if (isNaN(n) || !isFinite(n)) {
		throw new SQLRuntimeError(
			'Invalid bit field value for column "%s". ' + 
			'Expecting up to %s bits as binary number literal',
			this.name,
			this.length
		);
	}
	
	while (l++ < this.length) {
		v = '0' + v;
	}
	
	return v;
};





// Column_INT extends NumericColumn
// =============================================================================
function Column_INT() {}
Column_INT.prototype             = new NumericColumn();
Column_INT.prototype.constructor = Column_INT;
Column_INT.prototype.type        = "INT";
Column_INT.prototype.minUnsigned =  0;
Column_INT.prototype.minSigned   = -2147483648;
Column_INT.prototype.maxUnsigned =  4294967295;
Column_INT.prototype.maxSigned   =  2147483647;

Column_INT.prototype.init = function(options) 
{
	NumericColumn.prototype.init.call(this, options);

	if ( isArray(options.type.params) && options.type.params.length > 0) {
		if (options.type.params.length !== 1) {
			throw new SQLRuntimeError(
				'Invalid data type declaration for column "%s". The syntax ' + 
				'is "INT[(length)]".',
				options.name
			);
		}
		this.setLength(options.type.params[0]);
		this.typeParams = [this.length];	
	}
};

Column_INT.prototype.setLength = function(n) 
{
	var l = String(this.minSigned).length;
	n = parseInt(n, 10);
	if (isNaN(n) || !isFinite(n) || n < 1 || n > l ) {
		throw new SQLRuntimeError(
			'Invalid length for column "%s". The length must be between 1 ' + 
			'and %s inclusive.',
			this.name,
			l
		);
	}
	this.length = n;
};

Column_INT.prototype.set = function(value) 
{
	if (value === null) {
		if (this.nullable || this.autoIncrement)
			return value;

		throw new SQLRuntimeError('Column "%s" cannot be NULL.', this.name);
	}

	var n = parseInt(value, 10);
	
	if (isNaN(n) || !isFinite(n) || n < this.min || n > this.max) {
		throw new SQLRuntimeError(
			'Invalid value for column "%s". ' + 
			'Expecting an integer between %s and %s.',
			this.name,
			this.min,
			this.max
		);
	}
	
	return n;
};


// Column_INTEGER - alias of Column_INT
// =============================================================================
function Column_INTEGER() {}
Column_INTEGER.prototype             = new Column_INT();
Column_INTEGER.prototype.constructor = Column_INTEGER;
Column_INTEGER.prototype.type        = "INTEGER";


// Column_TINYINT extends Column_INT
// =============================================================================
function Column_TINYINT() {}
Column_TINYINT.prototype             = new Column_INT();
Column_TINYINT.prototype.constructor = Column_TINYINT;
Column_TINYINT.prototype.type        = "TINYINT";
Column_TINYINT.prototype.minUnsigned =  0;
Column_TINYINT.prototype.minSigned   = -128;
Column_TINYINT.prototype.maxUnsigned =  255;
Column_TINYINT.prototype.maxSigned   =  127;


// Column_SMALLINT extends Column_INT
// =============================================================================
function Column_SMALLINT() {}
Column_SMALLINT.prototype             = new Column_INT();
Column_SMALLINT.prototype.constructor = Column_SMALLINT;
Column_SMALLINT.prototype.type        = "SMALLINT";
Column_SMALLINT.prototype.minUnsigned =  0;
Column_SMALLINT.prototype.minSigned   = -32768;
Column_SMALLINT.prototype.maxUnsigned =  65535;
Column_SMALLINT.prototype.maxSigned   =  32767;


// Column_MEDIUMINT extends Column_INT
// =============================================================================
function Column_MEDIUMINT() {}
Column_MEDIUMINT.prototype             = new Column_INT();
Column_MEDIUMINT.prototype.constructor = Column_MEDIUMINT;
Column_MEDIUMINT.prototype.type        = "MEDIUMINT";
Column_MEDIUMINT.prototype.minUnsigned =  0;
Column_MEDIUMINT.prototype.minSigned   = -8388608;
Column_MEDIUMINT.prototype.maxUnsigned =  16777215;
Column_MEDIUMINT.prototype.maxSigned   =  8388607;


// Column_BIGINT extends Column_INT
// =============================================================================
function Column_BIGINT() {}
Column_BIGINT.prototype             = new Column_INT();
Column_BIGINT.prototype.constructor = Column_BIGINT;
Column_BIGINT.prototype.type        = "BIGINT";
Column_BIGINT.prototype.minUnsigned =  0;
Column_BIGINT.prototype.minSigned   = -9223372036854775808;
Column_BIGINT.prototype.maxUnsigned =  18446744073709551615;
Column_BIGINT.prototype.maxSigned   =  9223372036854775807;


// Column_DECIMAL extends NumericColumn
// =============================================================================
function Column_DECIMAL() {}
Column_DECIMAL.prototype             = new NumericColumn();
Column_DECIMAL.prototype.constructor = Column_DECIMAL;
Column_DECIMAL.prototype.type        = "DECIMAL";
Column_DECIMAL.prototype.length      = 10;
Column_DECIMAL.prototype.decimals    = 0;
Column_DECIMAL.prototype.minUnsigned = Column_INT.prototype.minUnsigned;
Column_DECIMAL.prototype.minSigned   = Column_INT.prototype.minSigned;
Column_DECIMAL.prototype.maxUnsigned = Column_INT.prototype.maxUnsigned;
Column_DECIMAL.prototype.maxSigned   = Column_INT.prototype.maxSigned;
Column_DECIMAL.prototype.min         = Column_INT.prototype.minUnsigned;
Column_DECIMAL.prototype.max         = Column_INT.prototype.maxUnsigned;

Column_DECIMAL.prototype.init = function(options) 
{
	//debugger;
	NumericColumn.prototype.init.call(this, options);

	if ( isArray(options.type.params) ) {
		if (options.type.params.length !== 1) {
			throw new SQLRuntimeError(
				'Invalid data type declaration for column "%s". The syntax ' + 
				'is "%s[(length)]".',
				options.name,
				this.type.toUpperCase()
			);
		}
		this.setLength(options.type.params[0]);
		this.typeParams = [this.length];

	}
	this.setDefaultValue(options.defaultValue);
	//console.log(this.defaultValue);
};

Column_DECIMAL.prototype.set = function(value) 
{
	var n = parseFloat(value);
	
	if (isNaN(n) || !isFinite(n) || n < this.min || n > this.max) {
		throw new SQLRuntimeError(
			'Invalid value for column "%s". ' + 
			'Expecting a number between %s and %s.',
			this.name,
			this.min,
			this.max
		);
	}
	//debugger;
	n = Number(value).toPrecision(this.length);
	
	return Number(n).toFixed(this.decimals);
};


// Column_NUMERIC - alias of Column_DECIMAL
// =============================================================================
function Column_NUMERIC() {}
Column_NUMERIC.prototype             = new Column_DECIMAL();
Column_NUMERIC.prototype.constructor = Column_NUMERIC;
Column_NUMERIC.prototype.type        = "NUMERIC";


// Column_DOUBLE extends NumericColumn
// =============================================================================
function Column_DOUBLE() {}
Column_DOUBLE.prototype             = new NumericColumn();
Column_DOUBLE.prototype.constructor = Column_DOUBLE;
Column_DOUBLE.prototype.type        = "DOUBLE";
Column_DOUBLE.prototype.length      = 10;
Column_DOUBLE.prototype.decimals    = 1;
Column_DOUBLE.prototype.minUnsigned = Column_INT.prototype.minUnsigned;
Column_DOUBLE.prototype.minSigned   = Column_INT.prototype.minSigned;
Column_DOUBLE.prototype.maxUnsigned = Column_INT.prototype.maxUnsigned;
Column_DOUBLE.prototype.maxSigned   = Column_INT.prototype.maxSigned;

Column_DOUBLE.prototype.init = function(options) 
{
	NumericColumn.prototype.init.call(this, options);

	if ( isArray(options.type.params) ) {
		if (options.type.params.length !== 1) {
			throw new SQLRuntimeError(
				'Invalid data type declaration for column "%s". The syntax ' + 
				'is "%s[(length)]".',
				options.name,
				this.type.toUpperCase()
			);
		}
		this.setLength(options.type.params[0]);
		this.typeParams = [this.length];	
	}
};

Column_DOUBLE.prototype.set = function(value) 
{
	var n = parseFloat(value, 10);
	
	if (isNaN(n) || !isFinite(n) || n < this.min || n > this.max) {
		throw new SQLRuntimeError(
			'Invalid value for column "%s". ' + 
			'Expecting a number between %s and %s.',
			this.name,
			this.min,
			this.max
		);
	}
	
	n = Number(value).toPrecision(this.length);
	
	var q = Math.pow(10, this.decimals);
    return Math.round(n * q) / q;
};

// Column_FLOAT extends NumericColumn
// =============================================================================
function Column_FLOAT() {}
Column_FLOAT.prototype             = new NumericColumn();
Column_FLOAT.prototype.constructor = Column_FLOAT;
Column_FLOAT.prototype.type        = "FLOAT";
Column_FLOAT.prototype.length      = 10;
Column_FLOAT.prototype.decimals    = 2;
Column_FLOAT.prototype.minUnsigned = Column_INT.prototype.minUnsigned;
Column_FLOAT.prototype.minSigned   = Column_INT.prototype.minSigned;
Column_FLOAT.prototype.maxUnsigned = Column_INT.prototype.maxUnsigned;
Column_FLOAT.prototype.maxSigned   = Column_INT.prototype.maxSigned;

Column_FLOAT.prototype.init = function(options) 
{
	NumericColumn.prototype.init.call(this, options);

	if ( isArray(options.type.params) ) {
		if (options.type.params.length !== 1) {
			throw new SQLRuntimeError(
				'Invalid data type declaration for column "%s". The syntax ' + 
				'is "%s[	(length)]".',
				options.name,
				this.type.toUpperCase()
			);
		}
		this.setLength(options.type.params[0]);
		this.typeParams = [this.length];	
	}
};

Column_FLOAT.prototype.set = function(value) 
{
	var n = parseFloat(value, 10);
	
	if (isNaN(n) || !isFinite(n) || n < this.min || n > this.max) {
		throw new SQLRuntimeError(
			'Invalid value for column "%s". ' + 
			'Expecting a number between %s and %s.',
			this.name,
			this.min,
			this.max
		);
	}
	
	n = Number(value).toPrecision(this.length);
	
	var q = Math.pow(10, this.decimals);
    return Math.round(n * q) / q;
};

// StringColumn extends Column
// =============================================================================
function StringColumn() {}
StringColumn.prototype             = new Column();
StringColumn.prototype.constructor = StringColumn;
StringColumn.prototype.type        = "STRING";
StringColumn.prototype.length      = -1;
StringColumn.prototype.maxLength   = Number.MAX_VALUE;

StringColumn.prototype.init = function(options) 
{
	if ( isArray(options.type.params) && 
		options.type.params.length > 0 &&
		String(options.type.params[0]) != "-1" ) 
	{
		this.setLength(options.type.params[0]);
		this.typeParams = [this.length];	
	}
	Column.prototype.init.call(this, options);
};

StringColumn.prototype.setLength = function(n) 
{
	n = parseInt(n, 10);
	if (isNaN(n) || !isFinite(n) || n < 0 ) {
		throw new SQLRuntimeError(
			'Invalid length for column "%s". The length must be a positive integer.',
			this.name
		);
	}
	this.length = Math.min(n, this.maxLength);
};

StringColumn.prototype.set = function(value) 
{
	var s = String(value), l;
	if (this.length == -1) {
		return s;
	}
	
	l = s.length;
	
	if (l > this.length) {
		throw new SQLRuntimeError(
			'Truncated value for column "%s".',
			this.name
		);
	}
	
	return s;
};

StringColumn.prototype.toSQL = function() 
{
	var sql = [
		quote(this.name), 
		this.typeToSQL(),
		this.nullable ? "NULL" : "NOT NULL"
	];

	if (this.key == "PRIMARY")
		sql.push("PRIMARY KEY");
	else if (this.key == "UNIQUE")
		sql.push("UNIQUE");
	else if (this.key == "INDEX")
		sql.push("KEY");

	if (this.defaultValue !== undefined) {
		sql.push(
			"DEFAULT",
			//typeof this.defaultValue == "string" ? 
				quote(this.defaultValue, "'") //: 
			//	this.defaultValue
		);
	}

	return sql.join(" ");
};



// Column_VARCHAR extends StringColumn
// =============================================================================
function Column_VARCHAR() {}
Column_VARCHAR.prototype             = new StringColumn();
Column_VARCHAR.prototype.constructor = Column_VARCHAR;
Column_VARCHAR.prototype.type        = "VARCHAR";
Column_VARCHAR.prototype.length      = -1;
Column_VARCHAR.prototype.maxLength   = 65535;

// Column_CHAR extends StringColumn
// =============================================================================
function Column_CHAR() {}
Column_CHAR.prototype             = new StringColumn();
Column_CHAR.prototype.constructor = Column_CHAR;
Column_CHAR.prototype.type        = "CHAR";
Column_CHAR.prototype.length      = -1;
Column_CHAR.prototype.maxLength   = 65535;




// -----------------------------------------------------------------------------
// Starts file "src/TableRow.js"
// -----------------------------------------------------------------------------
/**
 * Represents a table row which is a managed collection of TableCell objects.
 * @param {Table} table (optional; can be set later too)
 * @constructor
 * @return {TableRow}
 */
function TableRow(table, id)
{
	/**
	 * The id of the row is just it's sequence number provided by the contaning
	 * Table instance.
	 * @var Number
	 */
	this.id = id;

	/**
	 * The Table of this row
	 * @var Table
	 */
	this.table = null;

	/**
	 * The length of the row, i.e. the number of the cells inside it.
	 * IMPORTANT: Must me treated as read-only
	 * @var Number
	 */
	this.length = 0;

	/**
	 * The collection of TableCell objects
	 * @var Array
	 * @private
	 */
	this._cells = [];
	
	/**
	 * The collection of TableCell objects by name
	 * @var Object
	 * @private
	 */
	this._cellsByName = {};

	if (table) {
		this.setTable(table);
	}
}

TableRow.prototype = new Persistable();
TableRow.prototype.constructor = TableRow;

TableRow.prototype.getStorageKey = function()
{
	return [
		NS, 
		this.table._db.name, 
		this.table.name,
		this.id
	].join(".");
};

TableRow.prototype.load = function(onSuccess, onError)
{
	var row = this;
	JSDB.events.dispatch("loadstart:row", row);
	this.read(function(json) {
		for (var i = 0; i < row.length; i++) {
			row._cells[i].setValue(json[i]);
		}
		JSDB.events.dispatch("load:row", row);
		onSuccess(row);
	}, onError);
};

TableRow.prototype.save = function(onSuccess, onError)
{
	var row = this;
	JSDB.events.dispatch("before_save:row", row);
	row.write( this.toArray(), function() {
		JSDB.events.dispatch("after_save:row", row);
		if (onSuccess) onSuccess(row);
	}, onError );
};

/**
 * Injects the Table reference and then recreates the entire state of the 
 * instance by analyzing the table columns.
 * @param {Table} table
 * @return {TableRow}
 */
TableRow.prototype.setTable = function(table)
{
	var colName, col, cell;

	assertInstance(table, Table);
	
	this.length = 0;
	this._cellsByName = {};
	this.table = table;

	for (colName in table.cols) {
		col  = table.cols[colName];
		cell = new TableCell(col, this);
		this.length = this._cells.push(cell);
		this._cellsByName[colName] = cell;
	}

	return this;
};

/**
 * Returns a reference to one of the TableCells in the row by name.
 * @throws Error if the cell does not exist
 * @return {TableCell}
 */
TableRow.prototype.getCell = function(name)
{
	assertInObject(name, this._cellsByName, 'No such field "' + name + '".');
	return this._cellsByName[name];
};

/**
 * Returns a reference to one of the TableCells in the row by it's index.
 * @throws RangeError if the cell does not exist
 * @return {TableCell}
 */
TableRow.prototype.getCellAt = function(index)
{
	assertInBounds(index, this._cells, 'No field at index "' + index + '".');
	return this._cells[index];
};

/**
 * Sets the value of the cell specified by name or by index.
 * @param {String|Number} nameOrIndex The name or the index of the cell.
 * @value {String|Number} value
 * @throws Error if the cell does not exist
 * @return {TableRow} Returns the instance
 */
TableRow.prototype.setCellValue = function(nameOrIndex, value)
{
	var cell = isNumeric(nameOrIndex) ? 
		this.getCellAt(nameOrIndex) : 
		this.getCell(nameOrIndex);

	cell.setValue(value);
	return this;
};

/**
 * Gets the value of the cell specified by name or by index.
 * @param {String|Number} nameOrIndex The name or the index of the cell.
 * @throws Error if the cell does not exist
 * @return {any} Returns the cell value
 */
TableRow.prototype.getCellValue = function(nameOrIndex)
{
	return isNumeric(nameOrIndex) ? 
		this.getCellAt(nameOrIndex).value : 
		this.getCell(nameOrIndex).value;
};

/**
 * Creates and returns the array representation of the instance.
 * @return {Array}
 */
TableRow.prototype.toArray = function() 
{
	var out = [], i;
	for (i = 0; i < this.length; i++) {
		out[i] = this._cells[i].value;
	}
	return out;
};

/**
 * Creates and returns the plain object representation of the instance.
 * @return {Object}
 */
TableRow.prototype.toJSON = function() 
{
	var json = {};
	for (var x in this._cellsByName) {
		json[x] = this._cellsByName[x].value;
	}
	return json;
};


// -----------------------------------------------------------------------------
// Starts file "src/TableCell.js"
// -----------------------------------------------------------------------------
/**
 * Represents a single table cell. Holds a references to the corresponding
 * Column object from the table that contains the cell.
 * @param {Column} column The column of the field
 * @param {String|Number} value (Optional) initial value. Defaults to the 
 *     for the column (which in turn defaults to undefined)
 * @constructor
 * @return {TableCell}
 */
function TableCell(column, row, value) 
{
	this.setColumn(column);
	this.row = row;
	if (value !== undefined) {
		this.setValue(value);
	} else {
		this.setValue(
			this.column.defaultValue === undefined ?
				null : 
				this.column.defaultValue
		);
	}
}

TableCell.prototype = {

	/**
	 * The value of the cell.
	 * @var {any} Initially null
	 */
	value : null,

	/**
	 * Sets the Column instance that should correspond to this cell
	 * @param {Column}
	 * @return {TableCell} Returns the instance
	 */
	setColumn : function(column)
	{
		assertInstance(column, Column);
		this.column = column;
		return this;
	},

	/**
	 * Sets the underlying value by passing it to the Column object for
	 * validation first.
	 * @param {String|Number} value
	 * @return {TableCell} Returns the instance
	 */
	setValue : function(value)
	{
		this.value = this.column.set(value);
		if (this.value === null && this.column.autoIncrement) {
			this.value = this.row.table._ai;
		}
		return this;
	},

	/**
	 * This is useful for low level JS tasks. It will allow two fields to be
	 * compared using < or > operators for example. Also, an array of such
	 * objects can be sorted without passing a function to the sort method of
	 * the array...
	 */
	valueOf : function()
	{
		return this.value;
	}
};

// -----------------------------------------------------------------------------
// Starts file "src/TableIndex.js"
// -----------------------------------------------------------------------------

/**
 * The standard index type is "INDEX".
 * @var Number
 */
TableIndex.TYPE_INDEX = 2;

/**
 * The "UNIQUE" index works like the standard index but also 
 * checks for duplicated values before insert and update and
 * throws exceptions if such are found.
 * @var Number
 */
TableIndex.TYPE_UNIQUE = 4;

/**
 * The "PRIMARY" index is an unique key but it also ensures that there is only
 * one PRIMARY KEY per table
 * @var Number
 */
TableIndex.TYPE_PRIMARY = 8;

/**
 * Creates new TableIndex
 * @constructor
 * @param {Number} type One of the predefined TableIndex.TYPE_XXX constants.
 * @param {Table} table The table of the index
 * @param {Array} columns An array of one or more column names
 * @param {String} name The name of the index. This is optional. If not provided
 *     the name will be generated from the included column names (for multi-
 *     column indexes it will be the column names joined with an underscore).
 * @return {TableIndex}
 */
function TableIndex(table, columns, type, name)
{
	this.columns = [];
	this._index  = [];
	this.setTable(table);
	this.setType(type);
	this.setName(name || columns.join("_"));
	this.setColumns(columns);
	this.init();
}

/**
 * The default comparator used for sorting and binary search
 * @static
 */
TableIndex.compare = function(a, b) 
{
	return a === b ? 0 : a > b ? 1 : -1;
};

/**
 * Creates new instance from a configuration object and a table. This is used
 * to load indexes from their previously saved (as JSON) state.
 * @param {Object} json
 * @param {Table} table
 * @return {TableIndex}
 */
TableIndex.fromJSON = function(json, table) 
{
	var obj = new TableIndex(table, json.columns, json.type, json.name);
	return obj;
};

TableIndex.prototype = {

	/**
	 * Creates the "_index" property of the instance. It is an array of the 
	 * indexed column(s) values kept in sorted state
	 */
	init : function()
	{
		var allKeys = this.table._row_seq, // row IDs
			allRows = this.table.rows,     // rows
			allLen  = this.table._length,  // rows length
			colLen  = this.columns.length, // number of columns in this index
			row, id, i, y, idx;

		this._index = [];

		for ( i = 0; i < allLen; i++ )
		{
			id = allKeys[i];
			
			row = [];
			for ( y = 0; y < colLen; y++ ) 
			{
				row.push( allRows[id].getCell(this.columns[y]).value );
			}
			row = row.join("");

			idx = binarySearch(this._index, row, TableIndex.compare);
			this._index.splice(idx < 0 ? -idx - 1 : idx + 1, 0, row);
		}
	},

	/**
	 * Updates the index state to reflect the table contents. The table calls 
	 * this before INSERT.
	 * @param {TableRow} row The row that is about to be inserted
	 */
	beforeInsert : function(row)
	{
		var value = [], y, i;

		for ( y = 0; y < this.columns.length; y++ ) 
		{
			value.push( row.getCell(this.columns[y]).value );
		}

		value = value.join("");

		i = binarySearch(this._index, value, TableIndex.compare);
		//console.log(this.isUnique(), "IDX of ", value, ": ", i, this._index);

		if ( i >= 0 && this.isUnique() ) 
		{
			throw new SQLRuntimeError(
				'Duplicate entry for key "%s".',
				this.name
			);
		}

		i = i < 0 ? -i - 1 : i + 1;
		this._index.splice(i, 0, value);
	},

	beforeUpdate : function(row) 
	{
		// TODO
	},

	beforeDelete : function(row) 
	{
		// TODO
	},

	/**
	 * Sets the columns of the index. Note that this method assumes that the 
	 * columns do exist in the table.
	 * @param {Array} cols
	 * @throws {TypeError} if the argument is not an array
	 */
	setColumns : function(cols)
	{
		assertType(cols, "array");
		this.columns = cols.slice();
	},

	/**
	 * Sets the type of the index
	 * @param {Number} type One of the predefined TableIndex.TYPE_XXX constants.
	 */
	setType : function(type)
	{
		switch (type) {
			case TableIndex.TYPE_UNIQUE:
				this.type = type;
				break;
			case TableIndex.TYPE_PRIMARY:
				if ( this.table.primaryKey ) {
					throw new SQLRuntimeError(
						'A table can only have one PRIMARY KEY defined'
					);
				}
				this.type = type;
				this.table.primaryKey = this;
				break;
			//case TableIndex.TYPE_INDEX:
			default:
				this.type = type;
				break;
		}
	},

	/**
	 * Sets the Table reference
	 * @param {Table} table
	 * @throws {TypeError} on invalid argument
	 */
	setTable : function(table)
	{
		assertInstance(table, Table);
		this.table = table;
	},

	/**
	 * Sets the name of the index
	 * @param {String} name
	 * @throws {TypeError} If the name argument is not a string
	 * @throws {Error} If the name argument is empty
	 * @throws {SQLRuntimeError} if the name is not available
	 */
	setName : function(name)
	{
		assertType(name, "string", "The name of the index must be a string");
		name = trim(name);
		assert(name, "The name of the index cannot be empty");

		if ( name in this.table.keys ) {
			throw new SQLRuntimeError(
				'The table %s.%s already have a key named "%s".',
				this.table._db.name,
				this.table.name,
				name
			);
		}

		this.name = name;
	},

	/**
	 * Returns true if the index is unique (that should be true for
	 * UNIQUE and PRIMARY keys).
	 * @return {Boolean}
	 */
	isUnique : function()
	{
		return  this.type === TableIndex.TYPE_UNIQUE ||
				this.type === TableIndex.TYPE_PRIMARY;
	},

	/**
	 * Generates the plain object representation of the index. This is used 
	 * for serialization when the index gets saved as part of the table.
	 * @return {Object}
	 */
	toJSON : function()
	{
		return {
			name    : this.name,
			type    : this.type,
			columns : this.columns//,
			//index   : this._index
		};
	},
};



// -----------------------------------------------------------------------------
// Starts file "src/query.js"
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                            SQL Query Classes                               //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
function queryFactory(verb, subject, params)
{
	var Fn;
	if (verb == "CREATE") {
		if (subject == "DATABASE") {
			Fn = CreateDatabaseQuery;
		} else if (subject == "TABLE") {
			Fn = CreateTableQuery;
		} else {
			throw new Error(
				"Query for " + verb + "+" + subject + " not implemented"
			);
		}
	}

	var q = new Fn();
	if (params) {
		q.setParams(params);
	}
	return q;
}

function Query() {}
CreateQuery.prototype.setParams = function(params) {};

function CreateQuery() {}
CreateQuery.prototype = new CreateQuery();
CreateQuery.prototype.toString = function() {
	return this.generateSQL();
};

function query(sql, onSuccess, onError) {
	try {
		var parser = new Parser(onSuccess, onError);
		var out    = parser.parse(sql);

		//setTimeout(function() {
		//	onSuccess(out.result);
		//}, 500);
	} catch (ex) {
		(onError || defaultErrorHandler)(ex);
	}
}

// CreateDatabaseQuery ---------------------------------------------------------

/**
 * Class CreateDatabaseQuery extends CreateQuery
 * @constructor
 */
function CreateDatabaseQuery() {}

/** Inherit from CreateQuery */
CreateDatabaseQuery.prototype = new CreateQuery();

/**
 * The name of the database that will be created. Initially this is undefined.
 * @var {String}
 * @private
 */
CreateDatabaseQuery.prototype._name = undefined;

/**
 * The "If NOT EXISTS" flag. Defaults to false.
 * @var {Boolean}
 * @private
 */
CreateDatabaseQuery.prototype._ifNotExists = false;

/**
 * Generates and returns a "CREATE DATABASE" SQL query. This is used by the 
 * toString method too.
 * @throws {SQLRuntimeError} If the instance is incomplete
 * @return {String} The query as formatted SQL string
 */
CreateDatabaseQuery.prototype.generateSQL = function() 
{
	if (typeof this._name != "string") {
		throw new SQLRuntimeError("Invalid database name");
	}
	if (!this._name) {
		throw new SQLRuntimeError("No database name");
	}
	return "CREATE DATABASE " + (this._ifNotExists ? "IF NOT EXISTS " : "") + 
		quote(this._name, '"');
};

/**
 * Executes the query.
 * @return {void}
 */
CreateDatabaseQuery.prototype.execute = function() 
{
	SERVER.createDatabase(this._name, this._ifNotExists);
};

/**
 * Sets or gets the "_ifNotExists" flag. If the argument is missing (or if it
 * is undefined) returns the current value. Otherwise the argument is converted
 * to boolean and applied to the "_ifNotExists" flag.
 * @param {Boolean} bIf
 * @return {Boolean|CreateDatabaseQuery} Returns the instance on set or the 
 *                                       _ifNotExists value on get.
 */
CreateDatabaseQuery.prototype.ifNotExists = function(bIf) 
{
	if (bIf === undefined) {
		return this._ifNotExists;
	}
	this._ifNotExists = !!bIf;
	return this;
};

/**
 * Sets or gets the "name" of the database that should be created. If the 
 * argument is falsy returns the current name. Otherwise the argument is 
 * converted to string and written to the "name" property.
 * @param {String} dbName
 * @return {String|CreateDatabaseQuery} Returns the instance on set or the 
 *                                      current name on get.
 */
CreateDatabaseQuery.prototype.name = function(dbName) 
{
	if (dbName) {
		this._name = String(dbName);
		return this;
	}
	return this._name;
};

// CreateTableQuery ------------------------------------------------------------

/**
 * Class CreateDatabaseQuery extends CreateQuery
 * @constructor
 */
function CreateTableQuery() 
{
	this.columns = [];
	this.constraints = [];
}

/** Inherit from CreateQuery */
CreateTableQuery.prototype = new CreateQuery();

/**
 * The name of the table that should be created. Initially this is undefined.
 * @var {String}
 * @private
 */
CreateTableQuery.prototype._name = undefined;

/**
 * The flag indicating if the table should be created as temporary one.
 * Defaults to false.
 * @var {Boolean}
 * @private
 */
CreateTableQuery.prototype._temporary = false;

/**
 * The "If NOT EXISTS" flag. Defaults to false.
 * @var {Boolean}
 * @private
 */
CreateTableQuery.prototype._ifNotExists = false;

/**
 * Sets or gets the "_ifNotExists" flag. If the argument is missing (or if it
 * is undefined) returns the current value. Otherwise the argument is converted
 * to boolean and applied to the "_ifNotExists" flag.
 * @param {Boolean} bIf
 * @return {Boolean|CreateTableQuery} Returns the instance on set or the 
 *                                    _ifNotExists value on get.
 */
CreateTableQuery.prototype.ifNotExists = function(bIf) 
{
	if (bIf === undefined) {
		return this._ifNotExists;
	}
	this._ifNotExists = !!bIf;
	return this;
};

/**
 * Sets or gets the "_temporary" flag. If the argument is missing (or if it
 * is undefined) returns the current value. Otherwise the argument is converted
 * to boolean and applied to the "_temporary" flag.
 * @param {Boolean} bTemp
 * @return {Boolean|CreateTableQuery} Returns the instance on set or the 
 *                                    _temporary value on get.
 */
CreateTableQuery.prototype.temporary = function(bTemp) 
{
	if (bTemp === undefined) {
		return this._temporary;
	}
	this._temporary = !!bTemp;
	return this;
};

/**
 * Generates and returns a "CREATE TABLE" SQL query. This is used by the 
 * toString method too.
 * @throws {SQLRuntimeError} If the instance is incomplete
 * @return {String} The query as formatted SQL string
 */
CreateTableQuery.prototype.generateSQL = function() 
{
	
};

/**
 * Sets or gets the "name" of the table that should be created. If the 
 * argument is falsy returns the current name. Otherwise the argument is 
 * converted to string and written to the "name" property.
 * @param {String} tableName
 * @return {String|CreateTableQuery} Returns the instance on set or the 
 *                                   current name on get.
 */
CreateTableQuery.prototype.name = function(tableName) 
{
	if (tableName) {
		this._name = String(tableName);
		return this;
	}
	return this._name;
};

CreateTableQuery.prototype.addConstraint = function(constraint)
{
	this.constraints.push(constraint);
};

/**
 * Executes the query.
 * @return {void}
 */
CreateTableQuery.prototype.execute = function() 
{
	var table = createTable(
		this.name(), 
		this.columns, //fields
		this.ifNotExists(), 
		null //database
	);

	for (var i = 0, l = this.constraints.length; i < l; i++) {
		table.addConstraint(this.constraints[i]);
	}
};


// -----------------------------------------------------------------------------
// Starts file "src/export.js"
// -----------------------------------------------------------------------------
GLOBAL.JSDB = {

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
	Walker    : Walker,
	parse     : parse,
	query     : query,
	
	Table     : Table,
	SERVER    : SERVER,
	Column    : Column,
	TableRow  : TableRow,
	TableCell : TableCell,
	binarySearch   : binarySearch,
	BinaryTree     : BinaryTree,
	BinaryTreeNode : BinaryTreeNode
};

// -----------------------------------------------------------------------------
// Starts file "src/init.js"
// -----------------------------------------------------------------------------
(function() {
	JSDB.events = events;
	JSDB.SERVER = SERVER = new Server();
	//console.log("Server loading...");
	SERVER.load(function() {
		//console.log("Server loaded:", SERVER);
	}, function(error) {
		console.error(error);
	});
	//console.dir(SERVER);
})();


})(window);
