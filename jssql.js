/**
 * jsSQL version 0.0.26
 */
(function(GLOBAL,undefined){
"use strict";

// -----------------------------------------------------------------------------
// Starts file "src/constants.js"
// -----------------------------------------------------------------------------
var 

SERVER,

/**
 * This object contains parsers for various SQL statements
 * @namespace STATEMENTS
 */
STATEMENTS = {},

/**
 * The name of the global namespace
 * @type {String}
 */
NS = "JSDB",

/**
 * The namespace that will be exported globally
 * @namespace JSDB
 */
JSDB = {},

CFG = {},

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
 * @namespace Utils
 */

/**
 * Returns the float representation of the first argument or the
 * "defaultValue" if the float conversion is not possible.
 * @memberof Utils
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
 * @memberof Utils
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
 * @memberof Utils
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
 * @memberof Utils
 * @param {String} s The string to format
 * @param {*} ... The rest of the arguments are used for the replacements
 * @return {String}
 */
function strf(s) 
{
	var args = arguments, 
		l = args.length, 
		i = 0;
	return String(s || "").replace(/(%s)/g, function(a, match) {
		return ++i > l ? match : args[i];
	});
}

/**
 * Generates and returns a human-readable representation of arrays. This is used 
 * to generate the "expecting one of" strings... 
 * @memberof Utils
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
 * @memberof Utils
 * @param {String} 
 */
function quote(str, q) 
{
	q = q || '"';
	return q + String(str).replace(q, q + "" + q) + q;
}

function makeArray(x)
{
	if ( isArray(x) )
	{
		return x;
	}

	if ( typeof x.toArray == "function" )
	{
		return makeArray(x.toArray());
	}

	if ( x && typeof x == "object" && "length" in x )
	{
		return Array.prototype.slice.call(x);
	}

	return [x];
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
		//if ( typeof o.every == "function" ) {
		//	return o.every(callback, scope);
		//}
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
		database = SERVER.currentDatabase;
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

function isFunction(x)
{
	return Object.prototype.toString.call(x) == "[object Function]";
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

function mixin()
{
	var l = arguments.length, key, len, tmp, i, a, b;

	if (l < 1)
		return;

	a = arguments[0];

	if (l === 1)
		return mixin(isArray(a) ? [] : {}, a);

	for ( i = 1; i < l; i++ )
	{
		b = arguments[i];

		if ( isArray(b) ) 
		{
			len = b.length;
			for ( key = 0; key < len; key++ ) 
			{
				tmp = b[key];
				if ( tmp && typeof tmp == "object" ) {
					a[key] = mixin(isArray(tmp) ? [] : {}, a[key], tmp);
				} else {
					a[key] = tmp;
				}
			}
		} 
		else if (b && typeof b == "object")
		{
			for ( key in b ) 
			{
				if ( b.hasOwnProperty(key) ) 
				{
					tmp = b[key];
					if ( tmp && typeof tmp == "object" ) {
						a[key] = mixin(isArray(tmp) ? [] : {}, a[key], tmp);
					} else {
						a[key] = tmp;
					}
				}
			}
		}
	}

	return a;
}
/*
function expr(input, scope)
{
	var operators = {
		"."        : "",
		"("        : "",
		")"        : "",
		"CAST"     : "",
		"AS"       : "",
		"COLLATE"  : "",
		"LIKE"     : "",
		"ESCAPE"   : "",
		"GLOB"     : "",
		"REGEXP"   : "",
		"MATCH"    : "",
		"ISNULL"   : "",
		"NOTNULL"  : "",
		"NOT"      : "",
		"NULL"     : "",
		"IS"       : "",
		"BETWEEN"  : "",
		"AND"      : "",
		"IN"       : "",
		"EXISTS"   : "",
		"CASE"     : "",
		"WHEN"     : "",
		"THEN"     : "",
		"ELSE"     : "",
		"DISTINCT" : ""
	};

	// literal value
	// Column ref
	// "(" + expr + ")"
	// unary operator (-, +, ~)
	// CAST
	// EXISTS|NOT EXISTS
	// CASE
	// FINCTION name
}*/

function executeInSandbox(options)
{
	var args         = [],
		values       = [],
		sandbox      = options.sandbox || {},
		translations = options.translations || {},
		scope        = options.scope || {},
		body         = options.code || '',
		context      = options.context || options.context === null ? options.context : {},
		key;

	for ( key in sandbox ) {
		args.push( key );
		values.push( sandbox[key] );
	}

	for ( key in scope ) {
		body = body.replace(
			new RegExp("\\b" + key + "\\b", "gi"),
			"__scope__['" + key + "']"
		);
	}

	args.push( "__scope__" );
	values.push( scope );

	for ( key in translations ) {
		body = body.replace(new RegExp(key, "gi"), translations[key]);
	}

	body = body.replace(/^(\s*return\s+)?/, "return ");

	//console.log(body, args, values, context);
	return (new Function( args.join(", "), body )).apply( context, values );
}

function executeCondition(condition, scope) 
{
	return executeInSandbox({
		code    : condition, 
		sandbox : {},
		translations : {
			"={1,}"   : "===",
			"\\bOR\\b"  : "||",
			"\\bAND\\b" : "&&",
			"!={1,}"     : "!==",
			"(__scope__\\[[^\\]]+\\])\\s*LIKE\\s*('[^']*')" : function(all, input, search) {
				return 'LIKE(' + input + ', ' + search + ')';
			}
		},
		scope   : scope, 
		context : {}
	});
}

function LIKE(input, val) {//console.log("--> ", arguments);
	return (new RegExp(
		"^" + String(val)
		.replace(/\\%/g, "__ESCAPED_PCT__")
		.replace(/%/g, ".+?")
		.replace(/__ESCAPED_PCT__/g, "%")
		.replace(/\\_/g, "__ESCAPED_USC__")
		.replace(/_/g, ".")
		.replace(/__ESCAPED_USC__/g, "_")
		.replace(/\[\!(.+?)\]/g, "[^$1]") + "$"
	)).exec(input);
}

// JOIN functions --------------------------------------------------------------
function LinkedListNode(data)
{
	this.data = data;
}

LinkedListNode.prototype = {
	prev : null,
	next : null,
	before : function(data) {
		var node = new LinkedListNode(data);
		if (this.prev) {
			node.prev = this.prev;
			this.prev.next = node;
		}
		this.prev = node;
		node.next = this;
		return node;
	},
	after : function(data) {
		var node = new LinkedListNode(data);
		if (this.next) {
			node.next = this.next;
			this.next.prev = node;
		}
		this.next = node;
		node.prev = this;
		return node;
	}
};

function crossJoinUsingLinkedList(tables) 
{
	var tl = tables.length,
		rows = [],
		left, 
		right, 
		row, 
		row0,
		rowId,
		prev,
		next,
		first,
		cur,
		i = 0,
		l = 0,
		y;

	while ( i < tl )
	{
		right = tables[i++];

		if (i === 1) {
			for ( rowId in right.rows )
			{
				if (!first) {
					first = new LinkedListNode(right.rows[rowId]._data.slice());
					prev  = first;
				} else {
					prev  = prev.after(right.rows[rowId]._data.slice());
				}
			}
		} else {
			row = first;
			while ( row ) {
				y = 0;
				row0 = row.data;
				for ( rowId in right.rows )
				{
					if (++y === 1) {
						row.data = row0.concat( right.rows[rowId]._data );
					} else {
						row = row.after(row0.concat( right.rows[rowId]._data ));
					}
				}
				row = row.next;
			}
		}
	}

	row = first;
	while ( row ) {
		rows.push(row.data);
		row = row.next;
	}
	//console.dir(first);
	//console.dir(rows);
	return rows;
}

function crossJoin2(arrays)
{
	var al = arrays.length,
		ai = 0,
		ri,
		rl,
		li,
		ll,
		row,
		right,
		left = [], y;

	while( ai < al )
	{
		right = arrays[ai];
		rl = right.length;

		if ( ai === 0 )
		{
			for ( ri = 0; ri < rl; ri++ )
			{
				ll = left.push(mixin(right[ri]));
			}
		}
		else
		{
			for ( li = 0; li < ll; li++ ) 
			{
				row = mixin(left[li]);
				y = 0;
				for ( ri = 0; ri < rl; ri++ )
				{
					if (++y === 1) 
					{
						mixin(left[li], right[ri]);
					} 
					else 
					{
						left.splice(++li, 0, mixin({}, row, right[ri]));
						ll++;
					}
				}
			}
		}

		ai++;
	}

	return left;
}

function crossJoin(tables) 
{
	//crossJoinUsingLinkedList(tables);
	//console.time("crossJoin");
	var _tables = tables.slice(),
		tl = _tables.length,
		left, right, rowId, row, row0, i, l = 0, y;

	while ( tl-- )
	{
		right = _tables.shift();
		
		if (!left) {
			left = [];
			for ( rowId in right.rows )
			{
				l = left.push(right.rows[rowId]._data.slice());
			}
			continue;
		}

		for ( i = 0; i < l; i++ ) 
		{
			y = 0;
			row0 = left[i];
			for ( rowId in right.rows )
			{
				row = row0.concat(right.rows[rowId]._data);
				if (++y === 1) {
					left[i] = row;
				} else {
					left.splice(++i, 0, row);
					l++;
				}
			}
		}
	}
	//console.timeEnd("crossJoin");
	return left || [];
}

function innerJoin(tables, filter)
{
	console.time("innerJoin");
	var rows = crossJoin(tables).filter(filter);
	console.timeEnd("innerJoin");
	return rows;
}

/**
 * Joins two or more arrays together by merging their value objects
 * @param {Array} arrs An array of arrays of objects to me merged
 * @return {array} The joined array
 */
/*function joinArrays(arrs, join, sort) 
{
	var rows = [], rowIndex, row;
	
	if (!arrs) {
		return rows;
	}

	switch (join ? join.type : "") {
		case "INNER JOIN": // 280ms / 1000
			$.each(arrs, function(tableIndex, tableRows) {
				var hasMatch,
					tableRowsLength,
					rowsLength,
					rowIndex2,
					tmpRow,
					match,
					row2;

				if (tableIndex === 0) {
					rows = tableRows.slice();
				} else {
					rowsLength = rows.length;
					for (rowIndex = 0; rowIndex < rowsLength; rowIndex++) {
						hasMatch = false;
						row      = rows[rowIndex];
						trLength = tableRows.length;
						
						for (rowIndex2 = 0; rowIndex2 < trLength; rowIndex2++) {
							row2   = tableRows[rowIndex2];
							tmpRow = $.extend({}, row, row2);
							match  = tmpRow[join.key1] === tmpRow[join.key2];

							if (match) {
								if (!hasMatch) {
									hasMatch = 1;
									rows.splice(rowIndex, 1, tmpRow);
								} else {
									if (rowIndex2 === 0) {
										rows.splice(rowIndex, 1, tmpRow);
									} else {
										rows.splice(++rowIndex, 0, tmpRow);
										rowsLength++;
									}
								}
							}
						}

						if (!hasMatch) {
							rows.splice(rowIndex--, 1);
							rowsLength--;
						}
					}
				}
			});
		break;

		case "LEFT JOIN": // 300ms / 1000
			var tablesLen = arrs.length,
				rowsLen,
				tableRowsLen,
				tableIndex,
				tableRows,
				hasMatch,
				rowIndex2,
				row2,
				tmpRow,
				match,
				key;

			for (tableIndex = 0; tableIndex < tablesLen; tableIndex++) {
				tableRows = arrs[tableIndex];
				if (tableIndex === 0) {
					rows = tableRows.slice();
				} else {
					rowsLen = rows.length;
					for (rowIndex = 0; rowIndex < rowsLen; rowIndex++) {
						hasMatch     = false;
						row          = rows[rowIndex];
						tableRowsLen = tableRows.length;
						for (rowIndex2 = 0; rowIndex2 < tableRows.length; rowIndex2++) {
							row2   = tableRows[rowIndex2];
							tmpRow = $.extend({}, row, row2);
							match  = tmpRow[join.key1] === tmpRow[join.key2];

							if (match) {
								if (!hasMatch) {
									hasMatch = 1;
									rows.splice(rowIndex, 1, tmpRow);
								} else {
									if (rowIndex2 === 0) {
										rows.splice(rowIndex, 1, tmpRow);
									} else {
										rows.splice(++rowIndex, 0, tmpRow);
										rowsLen++;
									}
								}
							} else {
								if (rowIndex2 === 0) {
									for (key in row2) {
										row[key] = null;
									}
								}
							}
						}
					}
				}
			}
		break;
		
		case "RIGHT JOIN": // 300ms / 1000
			var tablesLen = arrs.length,
				tableIndex,
				tableRows,
				tableRowsLen,
				rowIndex2,
				row2,
				rowsLen,
				hasMatch,
				tmpRow,
				match,
				key;

			for (tableIndex = tablesLen - 1; tableIndex >= 0; tableIndex--) {
				tableRows = arrs[tableIndex];
				if (tableIndex === tablesLen - 1) {
					rows = tableRows.slice();
				} else {
					rowsLen = rows.length;
					for (rowIndex = 0; rowIndex < rowsLen; rowIndex++) {
						hasMatch     = false;
						row          = rows[rowIndex];
						tableRowsLen = tableRows.length;
						for (rowIndex2 = 0; rowIndex2 < tableRowsLen; rowIndex2++) {
							row2   = tableRows[rowIndex2];
							tmpRow = $.extend({}, row, row2);
							match  = tmpRow[join.key1] === tmpRow[join.key2];

							if (match) {
								if (!hasMatch) {
									hasMatch = 1;
									rows.splice(rowIndex, 1, tmpRow);
								} else {
									if (rowIndex2 === 0) {
										rows.splice(rowIndex, 1, tmpRow);
									} else {
										rows.splice(++rowIndex, 0, tmpRow);
										rowsLen++;
									}
								}
							} else {
								if (rowIndex2 === 0) {
									for (key in row2) {
										row[key] = null;
									}
								}
							}
						}
					}
				}
			}
		break;

		case "OUTER JOIN": // 200ms / 1000
		case "FULL JOIN":
		case "FULL OUTER JOIN":
			var proto      = {},
				leftTable  = arrs[0],
				rightTable = arrs[1];

			$.each(arrs, function(tableIndex, tableRows) {
				$.each(tableRows[0] || {}, function(k) {
					proto[k] = null;
				});
			});
			
			$.each(leftTable, function(rowIndex, row) {
				rows.push($.extend({}, proto, row));
			});

			$.each(rightTable, function(rowIndexR, rowR) {
				var found;
				$.each(rows, function(rowIndexL, rowL) {
					if (rowL[join.key1] === rowR[join.key2]) {
						if (rowR[join.key1] === null || rowL[join.key2] !== null) {
							rows.push($.extend({}, rowL, rowR));		
						} else {
							$.extend(rowL, rowR);
						}
						found = 1;
						return false;
					}
				});
				if (!found) {
					rows.splice(rowIndexR, 0, $.extend({}, proto, rowR));
				}
			});

			if (!sort) {
				rows.sort(function(a, b) {
					return (a[join.key1] || Infinity) - (b[join.key1] || Infinity);
				});
			}
		break;

		case "CROSS JOIN":// 300ms / 1000
		default:
			var rowIndex2,
				tableLen,
				rowsLen,
				row2;

			$.each(arrs, function(tableIndex, tableRows) {
				if (tableIndex === 0) {
					rows = tableRows.slice();
				} else {
					rowsLen = rows.length;
					for (rowIndex = 0; rowIndex < rowsLen; rowIndex++) {
						row      = rows[rowIndex];
						tableLen = tableRows.length;
						for (rowIndex2 = 0; rowIndex2 < tableLen; rowIndex2++) {
							row2 = tableRows[rowIndex2];
							if (rowIndex2 === 0) {
								$.extend(row, row2);
							} else {
								rows.splice(
									++rowIndex, 
									0, 
									$.extend({}, row, row2)
								);
								rowsLen++;
							}
						}
					}
				}
			});
		break;
	}

	return rows;
}*/


// -----------------------------------------------------------------------------
// Starts file "src/errors.js"
// -----------------------------------------------------------------------------
/**
 * Factory function for creating custom error classes
 */
function createErrorClass(name, defaultsMessage)
{
	var F = function()
	{
		this.name    = name;
		this.message = strf.apply(
			this, 
			arguments.length ? arguments : [defaultsMessage || "Unknown error"]
		);
	};

	F.prototype = new Error();
	F.prototype.constructor = F;
	return F;
}

/**
 * The base class for custom errors.
 * @constructor
 * @extends {Error}
 * @param {String} message - The error message. Defaults to "Unknown error". 
 * The message, along with any other following arguments will be 
 * passed to the {@link strf strf function}
 */
var CustomError = createErrorClass("CustomError");

/**
 * @constructor
 * @extends {Error}
 * @param {String} message - The error message. Defaults to "Error while parsing
 * sql query". The message, along with any other following arguments will be 
 * passed to the {@link strf strf function}
 */
var SQLParseError = createErrorClass("SQLParseError", "Error while parsing sql query");

/**
 * @constructor
 * @extends {Error}
 * @param {String} message - The error message. Defaults to "Error while parsing
 * sql query". The message, along with any other following arguments will be 
 * passed to the {@link strf strf function}
 */
var SQLRuntimeError = createErrorClass("SQLRuntimeError", "Error while executing sql query");

/**
 * @constructor
 * @extends {Error}
 * @param {String} message - The error message. Defaults to "SQL constraint 
 * violation". The message, along with any other following arguments will be 
 * passed to the {@link strf strf function}
 */
var SQLConstraintError = createErrorClass("SQLConstraintError", "SQL constraint violation");



// -----------------------------------------------------------------------------
// Starts file "src/events.js"
// -----------------------------------------------------------------------------
/**
 * The event system
 * @namespace events
 * @type {Object}
 */
function Observer() {
	
	var listeners = {};

	function returnFalse()
	{
		return false;
	}

	/**
	 * Adds an event listener
	 * @param {String} eType The event type to listen for
	 * @param {Function|Boolean} handler The function to be invoked. Can also be 
	 * a falsy value which will be internally converted to a function that 
	 * returns false.
	 * @return {Function} The bound event handler
	 */
	function bind(eType, handler) 
	{
		if (handler === false)
			handler = returnFalse;

		if (!listeners[eType])
			listeners[eType] = [];
		
		listeners[eType].push(handler);
		return handler;
	}

	/**
	 * Adds an event listener that removes itself after the first call to it
	 * @param {String} eType The event type to listen for
	 * @param {Function|Boolean} handler The function to be invoked. Can also be 
	 * a falsy value which will be internally converted to a function that 
	 * returns false.
	 * @return {Function} The bound event handler
	 */
	function one(eType, handler) 
	{
		if (handler === false)
			handler = returnFalse;

		function fn(data) {
			var out = handler(data);
			unbind(eType, fn);
			return out;
		}

		bind(eType, fn);
		return fn;
	}

	/**
	 * Removes event listener(s)
	 * 1. If the method is called with no arguments removes everything.
	 * 2. If the method is called with one argument removes everything for that
	 *    event type.
	 * 3. If the method is called with two arguments removes the specified 
	 *    handler from the specified event type.
	 * @param {String} eType The event type
	 * @param {Function|Boolean} handler The function to be removed. Can also be 
	 * a false to remove the generic "returnFalse" listeners.
	 * @return {void}
	 */
	function unbind(eType, handler) 
	{
		if (handler === false)
			handler = returnFalse;

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

	this.dispatch = function(e) 
	{
		var handlers = listeners[e] || [], 
			l = handlers.length, 
			i, 
			canceled = false,
			args = Array.prototype.slice.call(arguments, 0);

		//console.info("dispatch: ", e, data);

		for (i = 0; i < l; i++) {
			if (handlers[i].apply(this, args) === false) {
				canceled = true; 
				break;
			}
		}

		if (e != "*") {
			args.unshift("*");
			this.dispatch.apply(this, args);
		}

		return !canceled;
	};

	this.bind     = bind;
	this.unbind   = unbind;
	this.one      = one;
	this.on       = bind;
	this.off      = unbind;

}

var events = new Observer();

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

					// Should be an operator or start of negative number
					else 
					{
						if (state !== TOKEN_TYPE_NUMBER && (sql[pos + 1]||"").match(/[0-9]/)) {
							// Commit pending buffer (if any)
							if (buf) commit();
							state = TOKEN_TYPE_NUMBER;
						} else {
							// Commit pending buffer (if any)
							if (state !== TOKEN_TYPE_OPERATOR) {
								if (buf) commit();
								state = TOKEN_TYPE_OPERATOR;
							}
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
					// Should we close a multi-line comment or just append to it?
					if (state === TOKEN_TYPE_MULTI_COMMENT) 
					{
						buf += cur;
						pos++;
						if (sql[pos - 2] == "*") 
						{
							if (buf) commit(); // close
						}
						
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
					pos++;
					commit();
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


// -----------------------------------------------------------------------------
// Starts file "src/Walker.js"
// -----------------------------------------------------------------------------
/**
 * @constructor
 * @param {Array} tokens
 * @param {String} input
 */
function Walker(tokens, input)
{
	/**
	 * The tokens array
	 * @type {Array}
	 * @private
	 */
	this._tokens = [];

	this.init(tokens, input);
}

Walker.prototype = {
	
	/**
	 * The current position in the tokens array
	 * @type {Number}
	 * @private
	 */
	_pos : 0,

	/**
	 * The input string that has been used to produce the tokens array
	 * @type {String}
	 * @private
	 */
	_input : "",

	/**
	 * (Re)sets the instance to it's initial state. This allows single instance
	 * to be reused for different inputs.
	 * @param {Array} tokens
 	 * @param {String} input
 	 * @return {Walker} Returns the instance
	 */
	init : function(tokens, input)
	{
		this._pos = 0;
		this._tokens = tokens || [];
		this._input = input || "";
	},

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

	get : function()
	{
		return this._tokens[this._pos] ? this._tokens[this._pos][0] : "";
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

	require : function(arg, caseSensitive) 
	{
		if ( !this.is(arg, caseSensitive) ) {
			var prev = "the start of the query";
			if (this._pos > 0) {
				prev = this._input.substring(0, this._tokens[this._pos][2]);
				prev = prev.substring(prev.lastIndexOf(this.lookBack(5)[0]));
				prev = prev.replace(/[\r\n]/, "").replace(/\t/, " ");
				prev = prev.replace(/\s+$/, "");
				prev = "..." + prev;
			}
			
			throw new SQLParseError(
				'You have an error after %s. Expecting %s. The query was %s', 
				prev,
				arg,
				this._input
			);
		}
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
				'Expecting: %s after "%s". The query was %s', 
				prettyList(keys),
				prev,
				this._input
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
		
		throw new SQLParseError( 'Expecting: %s. The query was %s', prettyList(options), this._input );
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
						'Expecting "%s" after "%s". The query was %s', search[i], ahead[i - 1], inst._input
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
				'Expecting: %s %s. The query was %s',
				prettyList(keys),
				expectation || "",
				this._input
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
     * @param {String} value The value of the token or an "is" expression
     * @param {Function} callback Optional function to be called with each
     *                            skipped token. Note that this will be 
     *                            called event if the searched token is 
     *                            not found.
     * @return {Walker} Returns the instance
     */
	nextUntil : function(value, callback) 
	{ 
		while ( !this.is(value) ) 
		{
			if ( callback )
				callback.call( this, this.current() );
			if ( !this.next() )
				break;
		}
		
		return this; 
	},
	
	errorUntil : function(value) { 
		return this.nextUntil(value, function(token) {
			throw new SQLParseError(
				'Unexpected %s "%s". The query was %s', 
				TOKEN_TYPE_MAP[token[1]],
				token[0],
				this._input
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
			'Unexpected %s "%s". Expecting %s. The query was %s',
			TOKEN_TYPE_MAP[token[1]],
			token[0],
			prettyList(expecting),
			this._input
		);
	},

	commaSeparatedList : function(itemCallback)
	{
		var token  = this._tokens[this._pos],
			walker = this;
		
		if (token[0] == ",") {
			throw new SQLParseError('Unexpected ",". The query was %s', this._input);
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
					throw new SQLParseError('Unexpected ",". The query was %s', walker._input);
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
						'Expecting ")" after %s. The query was %s',
						prev || "the start of the query",
						walker._input
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
// Starts file "src/Transaction.js"
// -----------------------------------------------------------------------------
/**
 * Class Transaction
 * @classdesc Creates transaction objects which can be started, stopped and 
 * rolled back (undone). All the tasks inside the transaction queue are executed
 * asynchronously. There is a rich set of event callbacks available, as well as 
 * ability to observe the execution progress.
 * @param {Object}   options Optional configuration options.
 * @param {Function} options.onComplete Optional. The callback function to be
 *		invoked when the transaction is complete. The function will be called
 * 		with no arguments.
 * @param {Function} options.onRollback Optional. The callback function to be
 *		invoked when the transaction has been rolled back. The function will be
 *		called with the last error message as argument.
 * @param {Function} options.onError Optional. The callback function to be
 *		invoked when there is an error. The function will be
 *		called with the last error message as argument.
 * @param {Function} options.beforeTask Optional. 
 * @param {Function} options.afterTask Optional. 
 * @param {Function} options.beforeUndo Optional. 
 * @param {Function} options.afterUndo Optional. 
 * @param {Function} options.onProgress Optional. 
 * @param {Number} options.delay Optional. The number of milliseconds to wait 
 * 		before calling the next task in the queue. Defaults to 0.
 * @param {Number} options.timeout Optional. The number of milliseconds to wait 
 * 		for the current task to complete. If this time is exceeded the 
 *		transaction is aborted. Defaults to 1000 (one second).
 * @param {String} options.name Optional. The name of the transaction (to be 
 *		used for logging to identify the current transaction in case it is 
 * 		nested in another one...)
 * @param {Boolean} options.autoRollback Optional.
 * @param {Boolean} options.reqursiveRollback Optional. By default rolling back
 *		a nested transaction will also rollback it's parent transaction. Set 
 *		this to false to turn off this behavior.
 * 
 * The instance emits the following events:
 * <ul>
 *   <li>reset                    - after the instance has been reset</li>
 *   <li>error(error)             - on error</li>
 *   <li>before:task([task, pos]) - before a task is executed</li>
 *   <li>after:task([task, pos])  - after a task has been executed</li>
 *   <li>progress([q, task, pos]) - after a task has been executed or undone</li>
 *   <li>complete</li>
 *   <li>rollback(error)</li>
 *   <li>before:undo([task, pos])</li>
 *   <li>after:undo([task, pos])</li>
 * </ul>
 * @constructor
 */
function Transaction(options) 
{
	var 

	config = mixin({
		//onComplete   : noop,
		//onRollback   : noop, // args: lastError
		//onError      : noop, // args: Error error|String error message
		//beforeTask   : noop, // args: task, pos
		//afterTask    : noop, // args: task, pos
		beforeUndo   : noop, // args: task, pos
		afterUndo    : noop, // args: task, pos
		onProgress   : noop, // args: q, task, pos
		timeout      : 1000, // For any single task
		delay        : 0,
		name         : "Anonymous transaction",
		autoRollback : true
	}, options),

	/**
	 * Local reference to the instance
	 * @type {Transaction}
	 */
	inst = this,

	/**
	 * The task queue
	 * @type {Array}
	 * @private
	 */
	tasks = [],

	/**
	 * The length of the task queue
	 * @type {Number}
	 * @private
	 */
	length = 0,

	/**
	 * The current position within the task queue. The initial value is -1 which
	 * means that the transaction has not been started.
	 * @type {Number}
	 * @private
	 */
	position = -1,
	
	/**
	 * The timeout that executes the current task
	 * @private
	 */
	timer = null,
	
	/**
	 * The delay timeout
	 * @private
	 */
	delay = null,

	/**
	 * The total weight of the transaction. This is computed as the sum of the
	 * weights of all the tasks. Each task might define it's own weight. 
	 * Otherwise 1 is used for the task.
	 * @type {Number}
	 * @private
	 */ 
	weight = 0,
	
	/**
	 * Contains the last error message (if any). Defaults to an empty string.
	 * @type {String}
	 * @private
	 */
	lastError = "",

	/**
	 * The transaction observer
	 * @type {Object}
	 * @private
	 */
	events = new Observer();

	if (isFunction(config.onComplete))
		events.on("complete", config.onComplete);
	if (isFunction(config.onRollback))
		events.on("rollback", config.onRollback);
	if (isFunction(config.onError))
		events.on("error", config.onError);
	if (isFunction(config.beforeTask))
		events.on("before:task", config.beforeTask);
	if (isFunction(config.afterTask))
		events.on("after:task", config.afterTask);

	function destroy()
	{
		reset(true);
		events.off();
	}

	/**
	 * Resets the transaction
	 * @throws {Error} if the transaction is currently running
	 * @return {void}
	 */
	function reset(silent) 
	{
		if (isStarted() && !isComplete()) 
			throw new Error("Cannot reset a transacion while it is runing");
		
		if (timer) clearTimeout(timer);
		if (delay) clearTimeout(delay);
		
		tasks     = [];
		length    = 0;
		position  = -1;
		timer     = null;
		weight    = 0;
		lastError = "";

		if (!silent)
			events.dispatch("reset");
	}

	/**
	 * Calculates and returns the current position as a floating point number.
	 * This tipically represents ho many of the available tasks are complete,
	 * but can also be more complicated because each task can have it's own 
	 * weight defined which affects this number.
	 * @return {Number}
	 */
	function getProgress() 
	{
		var cur = 0, i;
		for (i = 0; i <= position; i++) {
			cur += tasks[i].weight || 1;
		}
		return cur / weight;
	}

	/**
	 * Checks if the transaction has been started
	 * @return {Boolean}
	 */
	function isStarted() 
	{
		return position > -1;
	}

	/**
	 * Checks if the transaction is empty
	 * @return {Boolean}
	 */
	function isEmpty() 
	{
		return length === 0;
	}

	/**
	 * Checks if the transaction is complete
	 * @return {Boolean}
	 */
	function isComplete() 
	{
		return !isEmpty() && position === length - 1;
	}
	
	/**
	 * Appends new task to the transaction queue.
	 * @param {Task|Transaction} task The task or sub-transaction to 
	 * 		add to the queue
	 * @throws {Error} If the transaction has already been started
	 * @return {void}
	 * @todo Allow for adding Transaction objects to create nested transactions
	 */
	function add(task) 
	{
		//if (isStarted()) 
		//	throw "The transaction has already ran";

		// Add nested transaction. In this case create new generic task that 
		// wraps the entire nested transaction
		if (task && task instanceof Transaction)
		{
			var tx = task;
			
			task = Transaction.createTask({
				name : "Nested transaction",
				execute : function(done, fail) 
				{
					tx.on("complete", done);
					tx.on("error", fail);
					tx.start();
				},
				undo : function(done) 
				{
					tx.on("rollback", done);
					tx.rollback();
				}
			});

			tx.parentTransaction = inst;

			weight += tx.getWeight();
		}
		else
		{
			weight += task.weight || 1;
			if (inst.parentTransaction) {
				inst.parentTransaction.setWeight(
					inst.parentTransaction.getWeight() + (task.weight || 1)
				);
			}
		}

		task.transaction = inst;
		length = tasks.push(task);
		task.name += " (at position " + length + ")";
	}

	/**
	 * The function that attempts to invoke the next task in the queue
	 */
	function next(callerPosition) 
	{
		// clear times if needed
		if (timer) clearTimeout(timer);
		if (delay) clearTimeout(delay);

		// Such a call might come from within a task that has already been 
		// "outdated" due to timeout
		if (callerPosition !== undefined && callerPosition !== position) {
			return;
		}

		if (!isComplete() && !isEmpty()) {
			(function worker(task, pos) {
				var _timeout = "timeout" in task ? task.timeout : config.timeout;
				
				if ( _timeout > 0 ) {
					timer = setTimeout(function() {
						lastError = "Task '" + task.name + "' timed out!.";
						events.dispatch("error", lastError);
						if (config.autoRollback) 
							undo(pos);
					}, _timeout + config.delay);
				}

				try {
					events.dispatch("before:task", task, pos);
					task.execute(
						function() {
							if (pos === position) {
								events.dispatch("progress", getProgress(), task, pos);
								config.onProgress(getProgress(), task, pos);
								events.dispatch("after:task", task, pos);
								delay = setTimeout(next, config.delay);
								//next();
							} 
						}, 
						function(e) {
							if (pos === position) {
								lastError = e || "Task '" + task.name + "' failed.";
								events.dispatch("error", lastError);
								if (config.autoRollback) 
									undo(pos);
							}
						}
					);
				} catch (ex) {
					events.dispatch("error", ex);
					if (config.autoRollback) 
						undo(pos);
				}
			})(tasks[++position], position);
		} else {
			events.dispatch("complete");
		}
	}

	/**
	 * Undoes all the completed actions on failure.
	 * @return {void}
	 */
	function undo(callerPosition) {
		if (timer) 
			clearTimeout(timer);

		if (delay) 
			clearTimeout(delay);
		
		// Such a call might come from within a task that has already been 
		// "outdated" due to timeout
		if (callerPosition !== undefined && callerPosition !== position) {
			return;
		}

		if (position < 0) {
			events.dispatch("rollback", lastError);
		} else {
			try {
				var task = tasks[position--];
				events.dispatch("before:undo", task, position + 1);
				config.beforeUndo(task, position + 1);
				task.undo(function() {
					events.dispatch("progress", getProgress(), task, position + 1);
					config.onProgress(getProgress(), task, position + 1);
					events.dispatch("after:undo", task, position + 1);
					config.afterUndo(task, position + 1);
					undo();
				}, function(error) {
					events.dispatch("progress", getProgress(), task, position + 1);
					config.onProgress(getProgress(), task, position + 1);
					events.dispatch("after:undo", task, position + 1);
					config.afterUndo(task, position + 1);
					events.dispatch("error", error || "Task '" + task.name + "' failed to undo");
					undo();
				});
			} catch (ex) {
				events.dispatch("error", ex);
				undo();
			}
		}
	}

	// Instance methods --------------------------------------------------------
	
	this.bind   = events.bind;
	this.on     = events.on;
	this.one    = events.one;
	this.unbind = events.unbind;
	this.off    = events.off;

	/**
	 * Returns the length of the task queue
	 * @return {Number}
	 */
	this.getLength = function()
	{
		return length;
	};

	/**
	 * Returns the weight of the transaction which is the sum of all task weights
	 * @return {Number}
	 */
	this.getWeight = function()
	{
		return weight;
	};

	this.setWeight = function(w)
	{
		weight = w;
	};

	/**
	 * Starts the transaction. Only non-empty, not started and not running 
	 * transaction can be started. Otherwise an Exception is thrown.
	 * @throws {Error}
	 * @return {void}
	 */
	this.start = function() 
	{
		//if (isEmpty()) 
		//	throw new Error("The transaction has no tasks");
		if (isComplete()) 
			throw new Error("The transaction is already complete");
		if (isStarted()) 
			throw new Error("The transaction is already running");
		
		events.dispatch("start");
		next();
	};

	/**
	 * Resets the transaction
	 * @throws {Error} if the transaction is currently running
	 * @return {void}
	 * @method reset
	 * @memberof Transaction.prototype
	 */
	this.reset = reset;

	this.destroy = destroy;

	/**
	 * Appends new task to the transaction queue.
	 * @param {Task} task The task to add
	 * @throws {Error} If the transaction has already been started
	 * @return {void}
	 * @method add
	 * @memberof Transaction.prototype
	 */
	this.add = add;

	/**
	 * Undoes all the completed actions on failure.
	 * @return {void}
	 * @method rollback
	 * @memberof Transaction.prototype
	 */
	this.rollback = undo;

	/**
	 * Checks if the transaction has been started
	 * @return {Boolean}
	 * @method isStarted
	 * @memberof Transaction.prototype
	 */
	this.isStarted = isStarted;

	/**
	 * Checks if the transaction is complete
	 * @return {Boolean}
	 * @method isComplete
	 * @memberof Transaction.prototype
	 */
	this.isComplete = isComplete;
	
	/**
	 * Checks if the transaction is empty
	 * @return {Boolean}
	 * @method isEmpty
	 * @memberof Transaction.prototype
	 */
	this.isEmpty = isEmpty;

	/**
	 * Calculates and returns the current position as a floating point 
	 * number. This tipically represents ho many of the available tasks are 
	 * complete, but can also be more complicated because each task can have 
	 * it's own weight defined which affects this number.
	 * @return {Number}
	 * @method getProgress
	 * @memberof Transaction.prototype
	 */
	this.getProgress = getProgress;

	/**
	 * Set the value of the configuration option identified by name
	 * @param {String} name The name of the option
	 * @param {*} value The new value for the option
	 * @return {Transaction} Returns the instance.
	 */
	this.setOption = function(name, value)
	{
		config[name] = value;
		return this;
	};

	/**
	 * Get the value of the configuration option identified by name
	 * @param {String} name The name of the option
	 * @return {*} Returns the option value or undefined if the option does not
	 *		exist.
	 */
	this.getOption = function(name)
	{
		return config[name];
	};

	this.next = next;

	this.setTaskProgress = function(q) {
		if (position > -1) {
			var task = tasks[position];
			config.onProgress(
				getProgress() - (1 - q) * (task.weight || 1) / weight, 
				task, 
				position
			);
		}
	};
}

/**
 * Creates new transaction tasks
 * @see Task
 * @static
 */
Transaction.createTask = function(options) {
	return new Task(options);
};

/**
 * @classdesc The Task class can be used to create Tasks suitable for
 * adding into transactions. The user is only required to provide "execute" and
 * and "undo" implementations. However additional properties might be defined:
 * @param {Object} options
 * @param {String} options.name Optional. The name of the task. Defaults to 
 *		"Anonymous task".
 * @param {Number} options.timeout Optional. The timeout for the task. If not
 *		provided, the global timeout option of the transaction will be used.
 * @param {Function} options.execute The function that will be invoked as the 
 * 		task worker. If this is not provided, an empty function is used and a 
 * 		warning is generated to the console.
 * @constructor
 */
function Task(options) 
{
	mixin(this, options);
}

Task.prototype = {
	
	/**
	 * The name of the task. Defaults to "Anonymous task"
	 * @type {String}
	 */
	name : "Anonymous task",

	/**
	 * The actual worker of the task.
	 * @param {Function} done The implementation MUST call this after the job is
	 *		successfully completed
	 * @param {Function} fail The implementation MUST call this if the job has
	 *		failed
	 * @return {void}
	 */
	execute : function(done, fail) {
		console.warn(
			"The 'execute' method for task '" + this.name + 
			"' is not implemented!"
		);
		done();
	},

	/**
	 * The function that undoes the task
	 * @param {Function} done The implementation MUST call this after the job is
	 *		successfully completed
	 * @param {Function} fail The implementation MUST call this if the job has
	 *		failed
	 * @return {void}
	 */
	undo : function(done, fail) {
		console.warn(
			"The 'undo' method for task '" + this.name + 
			"' is not implemented!"
		);
		done();
	}
};




// -----------------------------------------------------------------------------
// Starts file "src/statements/conflict-clause.js"
// -----------------------------------------------------------------------------
/**
 * Note that the entire on-conflict clause is optional
 * <pre>
 *  »» ══╦════════════════════════════════════════════════╦══ »» 
 *       │                                                │                     
 *       │  ┌────┐ ┌──────────┐         ┌────────────┐    │
 *       └──┤ ON ├─┤ CONFLICT ├────┬────┤  ROLLBACK  ├────┤
 *          └────┘ └──────────┘    │    └────────────┘    │
 *                                 │    ┌────────────┐    │
 *                                 ├────┤    ABORT   ├────┤
 *                                 │    └────────────┘    │
 *                                 │    ┌────────────┐    │
 *                                 ├────┤    FAIL    ├────┤
 *                                 │    └────────────┘    │
 *                                 │    ┌────────────┐    │
 *                                 ├────┤   IGNORE   ├────┤
 *                                 │    └────────────┘    │
 *                                 │    ┌────────────┐    │
 *                                 └────┤   REPLACE  ├────┘
 *                                      └────────────┘
 * </pre>
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
/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.USE = function(walker) {
	
	// Remember the last used DB here so that we can undo
	var lastUsedDB = SERVER.getCurrentDatabase();

	function undo(done, fail) {
		if (lastUsedDB) {
			SERVER.setCurrentDatabase(lastUsedDB.name);
			done('Current database restored to "' + lastUsedDB.name + '".');
		} else {
			done();
		}
	}
	
	return new Task({
		name : "Use Database",
		execute : function(done, fail) {
			var dbName;
			walker.someType(WORD_OR_STRING, function(token) {
				dbName = token[0];
			})
			.errorUntil(";")
			.commit(function() {
				try {
					SERVER.setCurrentDatabase(dbName);
					lastUsedDB = SERVER.getCurrentDatabase();
					done('Database "' + dbName + '" selected.');
				} catch (err) {
					fail(err);
				}
			});
		},
		undo : undo
	});
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/show_databases.js"
// -----------------------------------------------------------------------------
/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.SHOW_DATABASES = function(walker) {
	return new Task({
		name : "Show databases",
		execute : function(done, fail) {
			walker.errorUntil(";").commit(function() {
				done({
					cols : ["Databases"],
					rows : keys(SERVER.databases).map(makeArray)
				});
			});
		},
		undo : function(done, fail) {
			done(); // Nothing to undo here...
		}
	});
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/show_tables.js"
// -----------------------------------------------------------------------------
/**
 * The syntax is "SHOW tables [FROM|IN databse]". If the [FROM|IN databse] part
 * is missing, the current databse is used.
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {Function}
 * @throws {SQLRuntimeError} exception - If the databse cannot be resolved
 * @example
 * <pre style="font-family:Menlo, monospace">
 * 
 *     ┌──────┐ ┌──────────┐       
 *  >──┤ SHOW ├─┤  TABLES  ├───┬──────────────────────────────────────┬────>
 *     └──────┘ └──────────┘ ┌─│──────────────────────────────────────│─┐
 *                           │ │     ┌──────┐                         │ │
 *                           │ │  ┌──┤ FROM ├──┐                      │ │
 *                           │ │  │  └──────┘  │  ┌────────────────┐  │ │
 *                           │ └──┤            ├──┤ "databse name" ├──┘ │
 *                           │    │  ┌──────┐  │  └────────────────┘    │
 *                           │    └──┤  IN  ├──┘                        │
 *                           │       └──────┘                           │
 *                           └──────────────────────────────────────────┘
 *                           // If this is omitted, then the query is
 *                           // executed against the current database
 *                           // (if any)
 *                           
 * </pre>
 */
STATEMENTS.SHOW_TABLES = function(walker) 
{
	return new Task({
		name : "Show tables",
		execute : function(done, fail) {
			var db = SERVER.getCurrentDatabase(), dbName;

			if ( walker.is("FROM|IN") ) 
			{
				walker.forward();
				walker.someType(WORD_OR_STRING, function(token) {
					dbName = token[0];
					db = SERVER.databases[dbName];
				});
			}
			
			walker.nextUntil(";").commit(function() {
				if (!db) {
					if (dbName) {
						fail(new SQLRuntimeError('No such database "%s"', dbName));
					} else {
						fail(new SQLRuntimeError('No database selected'));
					}
				} else {
					done({
						cols : ['Tables in database "' + db.name + '"'],
						rows : keys(db.tables).map(makeArray)
					});
				}
			});
		},
		undo : function(done, fail) {
			done();// Nothing to undo here...
		}
	});
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/show_columns.js"
// -----------------------------------------------------------------------------
/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {Function}
 * @example
 * <pre style="font-family:Menlo, monospace">
 * 
 *                                  ┌──────┐
 *                               ┌──┤ FROM ├──┐
 *     ┌──────┐ ┌───────────┐    │  └──────┘  │  ┌──────────────┐  
 *  >──┤ SHOW ├─┤  COLUMNS  ├────┤            ├──┤ "table name" ├──┐
 *     └──────┘ └───────────┘    │  ┌──────┐  │  └──────────────┘  │
 *                               └──┤  IN  ├──┘                    │
 *                                  └──────┘                       │
 *   ┌─────────────────────────────────────────────────────────────┘  
 *   │
 *   └─────┬───────────────────────────────────────┬──────────────────>
 *         │                                       │
 *       ┌─│───────────────────────────────────────│─┐
 *       │ │      ┌──────┐                         │ │
 *       │ │   ┌──┤ FROM ├──┐                      │ │
 *       │ │   │  └──────┘  │  ┌────────────────┐  │ │ // If this is omitted, then the query is
 *       │ └───┤            ├──┤ "databse name" ├──┘ │ // executed against the current database
 *       │     │  ┌──────┐  │  └────────────────┘    │ // (if any)
 *       │     └──┤  IN  ├──┘                        │
 *       │        └──────┘                           │
 *       └───────────────────────────────────────────┘
 * </pre>
 */
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
			
	return new Task({
		name : "Show columns",
		execute : function(done, fail) {
			var dbName, tableName;

			walker.pick({
				"FROM|IN" : function() {
					walker.someType(WORD_OR_STRING, function(token) {
						tableName = token[0];
					});
				}
			});

			if ( walker.is("FROM|IN") )
			{
				walker.forward().someType(WORD_OR_STRING, function(token) {
					dbName = token[0];
				});
			}

			walker.nextUntil(";"); // TODO: Implement LIKE here
			
			walker.commit(function() {
				var database = dbName ? 
						SERVER.databases[dbName] : 
						SERVER.getCurrentDatabase(), 
					table;
				
				if (!database) {
					if ( dbName ) {
						return fail(new SQLRuntimeError('No such database "%s"', dbName));
					} else {
						return fail(new SQLRuntimeError('No database selected'));
					}
				}
				
				table = database.tables[tableName];

				if (!table)
				{
					return fail(new SQLRuntimeError(
						'No such table "%s" in databse "%s"',
						tableName,
						database.name
					));
				}
				
				var result = {
					cols : ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'],
					rows : []
				};
				
				each(table.cols, function(col) {
					var meta = col.toJSON(); //console.log("meta: ", meta);
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

				done(result);
			});
		},
		undo : function(done, fail) {
			done(); // Nothing to undo here....
		}
	});
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/create_database.js"
// -----------------------------------------------------------------------------
/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.CREATE_DATABASE = function(walker) {

	// remember the databse name here so that we can undo
	var dbName;

	function undo(done, fail) {
		if (dbName) {
			SERVER.dropDatabase(dbName, true, done, fail);
		} else {
			done();
		}
	}

	return new Task({
		name : "Create Database",
		execute : function(done, fail) {
			var q = new CreateDatabaseQuery();

			// Make sure to reset this in case it stores something from 
			// previous query
			dbName = null;

			walker
			.optional("IF NOT EXISTS", function() {
				q.ifNotExists(true);
			})
			.someType(WORD_OR_STRING, function(token) {
				q.name(token[0]);
			})
			.nextUntil(";")
			.commit(function() {
				dbName = q.name();
				q.execute();
				done('Database "' + q.name() + '" created.');
			});
		},
		undo : function(done, fail) {
			undo(done, fail);
		}
	});
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/create_table.js"
// -----------------------------------------------------------------------------
/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.CREATE_TABLE = function(walker) {
	
	// remember the table name here so that we can undo
	var tableName;

	function undo(done, fail) 
	{
		if (tableName) {
			var db = SERVER.getCurrentDatabase();
			if (db) {
				var table = db.tables[tableName];
				if (table) {
					fail("Droping tables is not fully implemented yet!");
				}
			}
			//SERVER.dropDatabase(dbName, true, done, fail);
			done();
		} else {
			done();
		}
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
		//console.log("constraint: ", constraint);

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
	
	return new Task({
		name : "Create Table",
		execute : function(done, fail) {
			var q = new CreateTableQuery();

			// Make sure to reset this in case it stores something from 
			// previous query
			tableName = null;

			q.temporary(walker.lookBack(2)[0].toUpperCase() == "TEMPORARY");
			
			walker
			.optional("IF NOT EXISTS", function() {
				q.ifNotExists(true);
			})
			.someType(WORD_OR_STRING, function(token) {
				q.name(token[0]);
				tableName = q.name();
			})
			.optional("(", function() {
				walk_createTableColumns(q);
			})
			.nextUntil(";")
			.commit(function() {
				//console.log("CreateTableQuery:");
				//console.dir(q);
				try {
					q.execute();
					done('Table "' + q.name() + '" created.');
				} catch (err) {
					fail(err);
				}
			});
		},
		undo : function(done, fail) {
			undo(done, fail);
		}
	});
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/drop_database.js"
// -----------------------------------------------------------------------------
/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.DROP_DATABASE = function(walker) {
	return new Task({
		name : "Drop Database",
		execute : function(done, fail) {
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
				done('Database "' + q.name + '" deleted.');
			});
		},
		undo : function(done, fail) {
			fail ("undo is not implemented for the DROP DATABASE queries");
		}
	});
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/drop_table.js"
// -----------------------------------------------------------------------------
/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.DROP_TABLE = function(walker) {
	var ifExists = false,
		tableName,
		dbName;
	
	return new Task({
		name : "Drop Table",
		execute : function(done, fail) {
			
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
						return done(
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
					done(
						'Table "' + database.name + '.' + table.name + '" deleted.'
					);
				}, fail);
			});
		},
		undo : function(done, fail) {
			fail("undo is not implemented for the DROP TABLE queries");
		}
	});
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/insert.js"
// -----------------------------------------------------------------------------
/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
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
	
	return new Task({
		name : "Insert Query",
		execute : function(done, fail) {
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
				done(valueSets.length + ' rows inserted.');
			});
		},
		undo : function(done, fail) {
			fail("undo not implemented for INSERT queries!");
		}
	});
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/select.js"
// -----------------------------------------------------------------------------
/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.SELECT = function(walker) {

	/**
	 * This will match any string (in any quotes) or just a word as unquoted 
	 * name.
	 * @type {String}
	 * @inner
	 * @private
	 */ 
	var identifier = [
		"@" + TOKEN_TYPE_WORD,
		"@" + TOKEN_TYPE_SINGLE_QUOTE_STRING,
		"@" + TOKEN_TYPE_DOUBLE_QUOTE_STRING,
		"@" + TOKEN_TYPE_BACK_TICK_STRING
	].join("|");

	/**
	 * This will match any identifier but also the "*" symbol.
	 * @type {String}
	 */ 
	var identifierOrAll = "*|" + identifier;

	/**
	 * Parses a table field reference witch might be defined as "fieldName" or 
	 * as "tableName.fieldName", or as "databaseName.tableName.fieldName". This 
	 * function does NOT try to evaluate the result to real field object. 
	 * Instead it just returns an object with "field", "table" and "database" 
	 * properties (the "database" and "table" will be null if not defined). 
	 * @return {Object}
	 * @throws {SQLParseError} if the input cannot be parsed correctly
	 * @param {Object} options Optional configuration object with the following
	 *     boolean properties (each of which defaults to false):
	 * 	   @includeAlias  If true, the function will also look for an
	 *     				  alias after the field declaration
	 *     @allowAll      If true, the function will also match "*" as field name
	 *     @allowIndexes  If true, the function will also match integers as 
	 *                    field names. This might be used in ORDER BY clause for 
	 *                    example
	 *     @includeDB     If true, the fields can be defined as db.table.field
	 *                    instead of just field or table.field
	 */
	function walkFieldRef(options) 
	{
		options = options || {};

		var out = {
			database : null, 
			table    : null,
			field    : null,
			isExpr   : false
		};

		var name = identifier;
		if (options.allowAll) {
			name += "|*";
		}
		if (options.allowIndexes) {
			name += "|@" + TOKEN_TYPE_NUMBER;
		}

		if (options.includeAlias) {
			out.alias = null;
		}

		try {
			walker.require(name);
			out.field = walker.get();
			walker.forward();
			if (walker.is(".")) {
				walker.forward().require(name);
				out.table = out.field;
				out.field = walker.get();
				walker.forward();
				if (options.includeDB && walker.is(".")) {
					walker.forward().require(name);
					out.database = out.table;
					out.table    = out.field;
					out.field    = walker.get();
					walker.forward();
				}
			}

			// now check what we have so far
			if (isNumeric(out.field)) {
				out.field = intVal(out.field);
				if (out.field < 0) {
					throw new SQLParseError('Negative column index is not allowed.');	
				}
			} else if (!out.field) {
				throw new SQLParseError('Expecting a field name');
			}

			if (out.table == "*") {
				throw new SQLParseError('You cannot use "*" as table name');
			} else if (isNumeric(out.table)) {
				throw new SQLParseError('You cannot use number as table name');
			}

			if (out.database == "*") {
				throw new SQLParseError('You cannot use "*" as database name');
			} else if (isNumeric(out.database)) {
				throw new SQLParseError('You cannot use number as database name');
			}
		} catch(e) {
			
			var start = walker.current()[2],
				end   = walker.current()[3];

			walker.nextUntil(",|AS|FROM|WHERE|GROUP|ORDER|LIMIT|OFFSET|;", function(tok) {
				end = tok[3];
			});

			out.field = walker._input.substring(start, end);
			out.isExpr = true;
		}

		// now check for an alias or just continue
		if (options.includeAlias) {
			if (walker.is(identifier)) { 
				if (walker.is("AS")) {
					walker.forward();
					walker.someType(WORD_OR_STRING, function(tok) {
						out.alias = tok[0];
					});
				}
				else if (walker.is("FROM|WHERE|GROUP|ORDER|LIMIT|OFFSET")) {
					
				}
				else {
					out.alias = walker.current()[0];
					walker.forward();
				}
			}
		}

		return out;
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
	function tableRef() 
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
			}, "for table name");
		});

		if (walker.is(identifier)) {
			if (walker.is("AS")) {
				walker.forward();
				walker.someType(WORD_OR_STRING, function(tok) {
					out.alias = tok[0];
				}, "for table alias");
			}
			else if (walker.is("WHERE|GROUP|ORDER|LIMIT|OFFSET")) {
				
			}
			else {
				out.alias = walker.current()[0];
				walker.forward();
			}
		}

		return out;
	}

	/**
	 * Collects the field references from the statement using the walkFieldRef
	 * function.
	 * @return {void}
	 */
	function collectFieldRefs(fields) 
	{
		var out = walkFieldRef({
			includeAlias : true, 
			allowAll     : true, 
			allowIndexes : false,//true,
			includeDB    : true
		});

		fields.push(out);

		if (walker.is(",")) {
			walker.forward();
			collectFieldRefs(fields);
		}
	}

	function collectTableRefs(tables)
	{
		var table = tableRef();
		tables.push(table);
		if (walker.is(",")) {
			walker.forward();
			collectTableRefs(tables);
		}
	}

	function collectNextOrderingTerm()
	{
		var orderBy = [],
			term = {
				expression : [],
				direction  : "ASC"
			};

		walker.nextUntil("ASC|DESC|,|LIMIT|OFFSET|;", function(tok) {
			term.expression.push(tok[0]);
		});

		term.expression = term.expression.join(" ");
		
		if ( walker.is("ASC|DESC") ) {
			term.direction = walker.get().toUpperCase();
			walker.forward();
		}

		orderBy.push(term);

		if ( walker.is(",") ) {
			walker.forward();
			orderBy = orderBy.concat(collectNextOrderingTerm());
		}

		return orderBy;
	}

	function walkOrderBy()
	{
		var orderBy = [];

		if (walker.is("ORDER BY")) {
			walker.forward(2);
			orderBy = collectNextOrderingTerm();
		}

		return orderBy;
	}

	function walkLimitAndOffset()
	{
		var limit  = 0,
			offset = 0;

		if (walker.is("LIMIT")) {
			walker.forward();

			if ( !walker.is("@" + TOKEN_TYPE_NUMBER) ) {
				throw new SQLParseError(
					"Expecting a number for the LIMIT clause"
				);
			}

			limit = intVal(walker.get());
			walker.forward();

			if (walker.is(",")) {
				if (!walker.forward().is("@" + TOKEN_TYPE_NUMBER)) {
					throw new SQLParseError(
						"Expecting a number for the offset part of the LIMIT clause"
					);
				}
				offset = intVal(walker.get());
				walker.forward();
			}
		}

		if (walker.is("OFFSET")) {//console.log(walker._tokens[walker._pos]);
			walker.forward();
			if (!walker.is("@" + TOKEN_TYPE_NUMBER)) {
				//console.log(walker._tokens[walker._pos]);
				throw new SQLParseError(
					"Expecting a number for the OFFSET clause"
				);
			}
			offset = intVal(walker.get());
			walker.forward();
		}
		//console.warn(walker._input, limit, offset);
		return {
			limit : limit,
			offset: offset
		};
	}

	function walkJoinConstraint()
	{
		if (walker.is("ON")) {

		} else if (walker.is("USING")) {

		}
	}

	function walkJoinOperator()
	{
		var join = [], l;

		if (walker.is("NATURAL")) {
			l = join.push("NATURAL");
			walker.forward();
		}

		if (walker.is("LEFT OUTER")) {
			l = join.push("LEFT OUTER");
			walker.forward(2);
		} else if (walker.is("LEFT|INNER|CROSS")) {
			l = join.push(walker.get().toUpperCase());
			walker.forward();
		}

		if (l) {
			join.push("JOIN");
		}

		return join.join(" ");
	}

	function walkWhere()
	{
		var start = 0, end   = 0;

		if ( walker.is("WHERE") ) {
			walker.forward();
			start = walker.current()[2];
			end   = start;
			walker.nextUntil("GROUP|ORDER|LIMIT|OFFSET|;");
			end = walker.current()[2];
		}
			
		return walker._input.substring(start, end);
	}

	function collectQueryTables(query)
	{
		var tablesLength = query.tables.length, tables = {}, i;

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

		return tables;
	}

	function getEnvironment()
	{
		var env = {},
			dbName,
			tableName,
			colName,
			table,
			col,
			db;

		for ( dbName in SERVER.databases )
		{
			db = SERVER.databases[dbName];
			env[dbName] = {};

			for ( tableName in db.tables )
			{
				table = db.tables[tableName];
				env[dbName][tableName] = {};

				for ( colName in table.cols )
				{
					col = table.cols[colName];
					env[dbName][tableName][colName] = col;
				}
			}
		}

		return env;
	}

	
	/**
	 * Executes the SELECT query and returns the result rows.
	 */
	function execute(query)
	{//debugger;
		var ENV          = getEnvironment(),
			rows         = [],
			cols         = [],
			tables       = collectQueryTables(query),
			columns      = {},
			colMap       = [],
			tablesLength = query.tables.length,
			fieldsLength = query.fields.length,
			rowsLength   = 0,
			fieldName,
			colName,
			rowIndex,
			tableIndex,
			tableRow,
			table,
			rowId,
			row,
			col,
			tmp,
			fld,
			db,
			i, y, l, j, f;

		//debugger;
		
		// Compose a row prototype object --------------------------------------
		var _databases = {};
		var _tables = {};
		var rowProto = {};

		function prepareField(fld, i)
		{
			var col = {
				database : fld.database,
				table    : fld.table,
				colIndex : i,
				value    : null,
				name     : fld.field,
				alias    : fld.alias,
				isExpr   : fld.isExpr
			};

			//console.log("fld: ", fld);

			if (fld.table) {
				table = getTable(fld.table.table, fld.table.database);

				if (!_tables.hasOwnProperty(table.name))
					_tables[table.name] = { name : table.name };

				col.table = _tables[table.name];

				if (!_databases.hasOwnProperty(table._db.name))
					_databases[table._db.name] = {};

				_tables[table.name].database = _databases[table._db.name];
				_databases[table._db.name][table.name] = col.table;
				col.database = _databases[table._db.name];
			}

			ENV[fld.field] = null;
			if (fld.alias) {
				ENV[fld.alias] = null;
			}

			rowProto[i] = rowProto[fld.field] = col;
			if (fld.alias) {
				rowProto[fld.alias] = col;
			}

			cols.push(col.alias || col.name);
		}

		y = 0;
		for ( i = 0; i < fieldsLength; i++ )
		{
			fld = query.fields[i];

			if (fld.field == "*") 
			{
				if (fld.table)
				{
					//debugger;
					table = getTable(fld.table, fld.database);
					for ( colName in table.cols ) 
					{
						prepareField({
							field    : colName,
							alias    : null,
							table    : { table : table.name, database : table._db.name },
							database : table._db.name,
							isExpr   : false
						}, y++);
					}
				}
				else
				{
					for ( j = 0; j < tablesLength; j++ ) 
					{
						table = tables[j];
						for ( colName in table.cols ) 
						{
							prepareField({
								field    : colName,
								alias    : null,
								table    : { table : table.name, database : table._db.name },
								database : table._db.name,
								isExpr   : false
							}, y++);
						}
					}
				}
			} 
			else 
			{
				// If the field is not an expression and the number of used 
				// tables is not 1, require a table name to be specified
				if (!fld.isExpr && !fld.table) 
				{
					if ( tablesLength !== 1 )
					{
						throw new SQLParseError(
							'The column "%s" needs to have it\'s table specified',
							fld.field
						);
					}

					fld.table = query.tables[0];
				}

				prepareField(fld, y++);
			}
		}

		rowProto.__length__ = y;

		//console.warn(ENV, rowProto);

		// Collect all rows from all the tables --------------------------------
		var _data = [], arr;
		for ( i = 0; i < tablesLength; i++ )
		{
			arr = [];
			table = tables[i];
			for ( rowId in table.rows )
			{
				arr.push(table.rows[rowId].toJSON());
			}
			_data.push(arr);
		}

		// Add expression fields -----------------------------------------------
		for ( i = 0; i < fieldsLength; i++ )
		{
			fld = query.fields[i];
			if (fld.isExpr) {
				col = {};
				col[fld.alias || fld.field] = fld.field.replace(/^\s*\((.*?)(\)\s*$)/, "$1");
				_data.push([col]);
			}
		}

		//console.dir(_data);
		rows = crossJoin2(_data);
		

		// orderBy -------------------------------------------------------------
		if ( query.orderBy ) {
			rows.sort(function(a, b) {
				var out = 0, col, valA, valB, i, term; 
				for ( i = 0; i < query.orderBy.length; i++ ) {
					term = query.orderBy[i];
					col  = term.expression;
					//debugger;
					//if (!isNumeric(col)) {
					//	col = cols.indexOf(col);
					//}
					
					//col = intVal(col);

					valA = a[col];
					valB = b[col];

					if (valA > valB) {
						out += term.direction == "ASC" ? 1 : -1;
					}
					else if (valA < valB) {
						out += term.direction == "ASC" ? -1 : 1;
					}

					if (out !== 0)
						break;
				}
				return out;
			});
		}

		var limit  = query.bounds.limit,
			offset = query.bounds.offset,
			len    = rows.length;

		if (offset < 0) {
			offset = len + offset;
		}

		l = rows.length;

		// Evaluate expressions in field list ----------------------------------
		for ( i = 0; i < l; i++ ) {
			row = rows[i];
			for ( fieldName in row ) {
				f = rowProto[fieldName];
				if (f && f.isExpr) {
					row[fieldName] = executeCondition(row[fieldName], row);
				}
			}
		}

		var rows2 = [];
		
		for ( i = 0; i < l; i++ ) {
			
			// Apply OFFSET
			// -----------------------------------------------------------------
			if (i < offset) {
				continue;
			}

			// Apply LIMIT -----------------------------------------------------
			if (limit && i >= offset + limit) {
				continue;
			}

			row = rows[i];

			// Apply the "WHERE" conditions
			// -----------------------------------------------------------------
			if (query.where && !executeCondition(query.where, row)) {
				continue;
			}

			// Exclude unused fields from the result rows
			// -----------------------------------------------------------------
			for ( fieldName in row ) {
				f = rowProto[fieldName];
				if (!f) {
					delete row[fieldName];
				} 
				else if (f.alias && f.alias !== fieldName) {
					delete row[fieldName];
				}
			}

			rows2.push(row);
		}

		return {
			cols : cols,
			rows : rows2
		};
	}

	return new Task({
		name : "SELECT Query",
		execute : function(done, fail) {//console.log("WALK SELECT");
			//debugger;
			var query = {
				fields : [],
				tables : []
			};
			//debugger;
			collectFieldRefs(query.fields);

			
			//console.log("current: ", walker.current()[0]);
			walker.optional({
				"FROM" : function() {//console.log("current: ", walker.current()[0]);
					collectTableRefs(query.tables);
				}
			});

			query.where   = walkWhere(); 
			query.orderBy = walkOrderBy();
			query.bounds  = walkLimitAndOffset();
			//console.log("query: ", query);
			
			// table -------------------------------------------------------
			//var //tbl   = tableRef(),
			//	table = getTable(query.tables[0].table, query.tables[0].database);
			
			walker
			.errorUntil(";")
			.commit(function() {//console.log("EXEC SELECT");
				//console.dir(query);
				var result = execute(query);
				done({
					cols : result.cols,
					rows : result.rows
				});
			});
		},
		undo : function(done, fail) {
			done(); // There is nothing to undo after select
		}
	});
};

// -----------------------------------------------------------------------------
// Starts file "src/statements/delete.js"
// -----------------------------------------------------------------------------
/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {Function}
 * @example
 * <pre style="font-family:Menlo, monospace">
 * 
 *     ┌────────┐ ┌──────┐                                ┌──────────────┐  
 *  >──┤ DELETE ├─┤ FROM ├─┬────────────────────────────┬─┤ "table name" ├──┐
 *     └────────┘ └──────┘ │ ┌─────────────────┐  ┌───┐ │ └──────────────┘  │
 *                         └─┤ "Database name" ├──┤ . ├─┘                   │
 *                           └─────────────────┘  └───┘                     │
 *   ┌──────────────────────────────────────────────────────────────────────┘  
 *   │
 *   └─────┬────────────────────────────────┬──────────────────>
 *         │    ┌───────┐    ┌───────┐      │
 *         └────┤ WHERE ├────┤ EXPR. ├──────┘
 *              └───────┘    └───────┘
 *             
 *
 * </pre>
 */
STATEMENTS.DELETE = function(walker) {

	return new Task({
		name : "Delete Query",
		execute : function(done, fail)
		{
			var tableName, dbName, start = 0, end = 0, where = "";

			/**
			 * This will match any string (in any quotes) or just a word as unquoted 
			 * name.
			 * @type {String}
			 * @inner
			 * @private
			 */ 
			var identifier = [
				"@" + TOKEN_TYPE_WORD,
				"@" + TOKEN_TYPE_SINGLE_QUOTE_STRING,
				"@" + TOKEN_TYPE_DOUBLE_QUOTE_STRING,
				"@" + TOKEN_TYPE_BACK_TICK_STRING
			].join("|");

			walker.require("FROM");
			
			if ( !walker.forward().is(identifier) )
			{
				throw new SQLParseError(
					'Expecting an identifier for table name before "%s"',
					walker.get()
				);
			}

			tableName = walker.get();

			if ( walker.forward().is(".") )
			{
				if ( !walker.forward().is(identifier) )
				{
					throw new SQLParseError(
						'Expecting an identifier for table name after %s.',
						tableName
					);
				}

				dbName = tableName;
				tableName = walker.get();
				walker.forward();
			}



			if ( walker.is("WHERE") ) 
			{
				walker.forward();
				start = walker.current()[2];
				end   = start;
				walker.nextUntil(";");
				end   = walker.current()[2];
				where = walker._input.substring(start, end);
			}
			else 
			{
				walker.errorUntil(";");
			}	

			walker.commit(function() {

				var db = dbName ?
						SERVER.getDatabase(dbName) :
						SERVER.getCurrentDatabase(),
					table,
					rows,
					rowIds = [],
					len = 0;

				if ( !db )
				{
					if ( dbName )
					{
						throw new SQLRuntimeError("No such database '%s'", dbName);
					}
					else
					{
						throw new SQLRuntimeError("No database selected");
					}
				}

				table = db.getTable(tableName);
				rows  = table.rows;

				//console.log(
				//	" dbName   : ", db.name   , "\n",
				//	"tableName: ", table.name, "\n",
				//	"where    : ", where, "\n",
				//	"rows     : ", rows
				//);

				each(rows, function(row, rowId, allRows) {
					if ( !where || executeCondition( where, row.toJSON(true) ) )
					{
						len = rowIds.push(row);
					}
				});

				if ( len ) 
				{
					
					table.deleteRows(rowIds, function() {
						done(len + " rows deleted");
					}, fail);
				}
				else
				{
					done(len + " rows deleted");
				}
			});
		},
		undo : function(done, fail) {
			fail("undo not implemented for DELETE queries!");
		}
	});
};


// -----------------------------------------------------------------------------
// Starts file "src/statements/update.js"
// -----------------------------------------------------------------------------
/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {Function}
 * @example
 * <pre style="font-family:Menlo, monospace">
 * 
 *     ┌────────┐                             ┌──────────────┐  
 *  >──┤ UPDATE ├──┬──────────────────────┬───┤ "table name" ├──┐
 *     └────────┘  │ ┌────┐  ┌──────────┐ │   └──────────────┘  │
 *                 ├─┤ OR ├──┤ ROLLBACK ├─┤                     │
 *                 │ └────┘  └──────────┘ │                     │
 *                 │ ┌────┐  ┌──────────┐ │                     │
 *                 ├─┤ OR ├──┤  ABORT   ├─┤                     │
 *                 │ └────┘  └──────────┘ │                     │
 *                 │ ┌────┐  ┌──────────┐ │                     │
 *                 ├─┤ OR ├──┤ REPLACE  ├─┤                     │
 *                 │ └────┘  └──────────┘ │                     │
 *                 │ ┌────┐  ┌──────────┐ │                     │
 *                 ├─┤ OR ├──┤   FAIL   ├─┤                     │
 *                 │ └────┘  └──────────┘ │                     │
 *                 │ ┌────┐  ┌──────────┐ │                     │
 *                 └─┤ OR ├──┤  IGNORE  ├─┘                     │
 *                   └────┘  └──────────┘                       │
 *   ┌──────────────────────────────────────────────────────────┘  
 *   │ ┌─────┐     ┌───────────────┐ ┌───┐ ┌───────┐    ┌───────┐  ┌───────┐
 *   └─┤ SET ├──┬──┤ "column name" ├─┤ = ├─┤ expr. ├──┬─┤ WHERE ├──┤ expr. ├──>
 *     └─────┘  │  └───────────────┘ └───┘ └───────┘  │ └───────┘  └───────┘
 *              │               ┌───┐                 │
 *              └───────────────┤ , │<────────────────┘
 *                              └───┘
 *             
 *
 * </pre>
 */
STATEMENTS.UPDATE = function(walker) {

	/**
	 * This will match any string (in any quotes) or just a word as unquoted 
	 * name.
	 * @type {String}
	 * @inner
	 * @private
	 */ 
	var identifier = [
		"@" + TOKEN_TYPE_WORD,
		"@" + TOKEN_TYPE_SINGLE_QUOTE_STRING,
		"@" + TOKEN_TYPE_DOUBLE_QUOTE_STRING,
		"@" + TOKEN_TYPE_BACK_TICK_STRING
	].join("|");

	/**
	 * Parses the OR part of the UPDATE statement.
	 * @param {Walker} walker
	 * @return {String} The name af the action to take on failure. One of 
	 * ROLLBACK|ABORT|REPLACE|FAIL|IGNORE. Defaults to ABORT.
	 */
	function getAltBehavior(walker)
	{
		var or = "ABORT";

		if ( walker.is("OR") )
		{
			walker.forward().require("ROLLBACK|ABORT|REPLACE|FAIL|IGNORE");
			or = walker.get().toUpperCase();
			walker.forward();
		}

		return or;
	}

	/**
	 * Gets the table that is to be updated
	 * @param {Walker} walker
	 * @return {Table}
	 */
	function getTable(walker)
	{
		var tableName, dbName, db;

		if ( !walker.is(identifier) )
		{
			throw new SQLParseError(
				'Expecting a table identifier before "%s"',
				walker.get()
			);
		}

		tableName = walker.get();

		if ( walker.forward().is(".") )
		{
			if ( !walker.forward().is(identifier) )
			{
				throw new SQLParseError(
					'Expecting an identifier for table name after %s.',
					tableName
				);
			}

			dbName = tableName;
			tableName = walker.get();
			walker.forward();
		}

		db = dbName ?
			SERVER.getDatabase(dbName) :
			SERVER.getCurrentDatabase();

		if ( !db )
		{
			if ( dbName )
			{
				throw new SQLRuntimeError("No such database '%s'", dbName);
			}
			else
			{
				throw new SQLRuntimeError("No database selected");
			}
		}

		return db.getTable(tableName);
	}

	/**
	 * Parses the WHERE part of the UPDATE statement.
	 * @param {Walker} walker
	 * @return {String} The WHERE expression.
	 */
	function getWhere(walker)
	{
		var where = "", start, end;

		if ( walker.is("WHERE") ) 
		{
			walker.forward();
			start = walker.current()[2];
			end   = start;
			walker.nextUntil(";");
			end   = walker.current()[2];
			where = walker._input.substring(start, end);
		}

		return where;
	}

	/**
	 * Parses the SET part of the UPDATE statement and returns a map object
	 * containing the column names as keys and value expressions as values that
	 * should be applied.
	 * @param {Walker} walker
	 * @return {Object}
	 */
	function getUpdater(walker)
	{
		var updater = {};

		function getPair()
		{
			var name, value, start, end;

			if ( !walker.is(identifier) )
			{
				throw new SQLParseError(
					'Expecting a column identifier before "%s"',
					walker.get()
				);
			}

			name = walker.get();

			walker.forward();
			walker.require("=");
			start = walker.current()[3];
			walker.forward();

			
			end   = start;
			walker.nextUntil(",|WHERE|;");
			end   = walker.current()[2];
			value = trim(walker._input.substring(start, end));
			//console.log(value);

			updater[name] = value;

			if (walker.is(",")) {
				walker.forward();
				getPair();
			}
		}

		walker.require("SET");
		walker.forward();
		getPair();

		return updater;
	}

	return new Task({
		name : "Update Table",
		execute : function(done, fail)
		{
			var or      = getAltBehavior(walker),
				table   = getTable(walker),
				updater = getUpdater(walker),
				where   = getWhere(walker);

			//console.log("or = ", or, "table: ", table, "updater: ", updater, "where: ", where);

			walker.errorUntil(";").commit(function() {
				table.update(
					updater, 
					or, 
					where, 
					function() {
						done("DONE");
					}, 
					function(e) {
						fail(e);
					}
				);
			});
		},
		undo : function(done, fail) {
			fail("undo is not implemented for UPDATE queries yet!");
		}
	});
};


// -----------------------------------------------------------------------------
// Starts file "src/statements/begin.js"
// -----------------------------------------------------------------------------
/** 
 * No changes can be made to the database except within a transaction. Any
 * command that changes the database (basically, any SQL command other than
 * SELECT) will automatically start a transaction if one is not already in
 * effect. Automatically started transactions are committed when the last query
 * finishes.
 * 
 * Transactions can be started manually using the BEGIN command. Such
 * transactions usually persist until the next COMMIT or ROLLBACK command. But a
 * transaction will also ROLLBACK if the database is closed or if an error occurs
 * and the ROLLBACK conflict resolution algorithm is specified. See the
 * documentation on the ON CONFLICT clause for additional information about the
 * ROLLBACK conflict resolution algorithm.
 * 
 * END TRANSACTION is an alias for COMMIT.
 * 
 * Transactions created using BEGIN...COMMIT do not nest. For nested
 * transactions, use the SAVEPOINT and RELEASE commands. The "TO SAVEPOINT name"
 * clause of the ROLLBACK command shown in the syntax diagram above is only
 * applicable to SAVEPOINT transactions. An attempt to invoke the BEGIN command
 * within a transaction will fail with an error, regardless of whether the
 * transaction was started by SAVEPOINT or a prior BEGIN. The COMMIT command and
 * the ROLLBACK command without the TO clause work the same on SAVEPOINT
 * transactions as they do with transactions started by BEGIN.
 * 
 * 
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {Function}
 * @example  * <pre style="font-family:Menlo, monospace">
 *
 *    ┌───────┐                        ┌─────────────┐  
 * >──┤ BEGIN ├──┬───────────────┬───┬─┤ TRANSACTION ├─┬──>
 *    └───────┘  │ ┌───────────┐ │   │ └─────────────┘ │
 *               ├─┤ DEFERRED  ├─┤   │                 │
 *               │ └───────────┘ │   └─────────────────┘
 *               │ ┌───────────┐ │
 *               ├─┤ IMEDDIATE ├─┤
 *               │ └───────────┘ │
 *               │ ┌───────────┐ │
 *               └─┤ EXCLUSIVE ├─┘
 *                 └───────────┘
 * </pre>
 */ 
STATEMENTS.BEGIN = function(walker) {
	return new Task({
		name : "Begin transaction",
		execute : function(done, fail) {
			
			var type = "DEFERRED";

			if ( walker.is("DEFERRED|IMEDDIATE|EXCLUSIVE") )
			{
				type = walker.get().toUpperCase();
				walker.forward();
			}

			if (walker.is("TRANSACTION"))
				walker.forward();
			
			walker.errorUntil(";");

			walker.commit(function() {
				SERVER.beginTransaction({ type : type });
				done("Transaction created");
			});
		},
		undo : function(done, fail) {
			SERVER.rollbackTransaction(done, fail);
		}
	});
};


// -----------------------------------------------------------------------------
// Starts file "src/statements/commit.js"
// -----------------------------------------------------------------------------
/** 
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {Function}
 * @example  * <pre style="font-family:Menlo, monospace">
 *
 *       ┌────────┐         ┌─────────────┐  
 * >──┬──┤ COMMIT ├──┬───┬──┤ TRANSACTION ├──┬──>
 *    │  └────────┘  │   │  └─────────────┘  │
 *    │  ┌────────┐  │   │                   │
 *    └──┤  END   ├──┘   └───────────────────┘
 *       └────────┘
 * </pre>
 */ 
STATEMENTS.COMMIT = function(walker) {
	return new Task({
		name : "Commit transaction",
		execute : function(done, fail) {
			if (walker.is("TRANSACTION"))
				walker.forward();
			
			walker.errorUntil(";");

			walker.commit(function() {
				SERVER.commitTransaction();
				done();
			});
		},
		undo : function(done, fail) {
			SERVER.rollbackTransaction(done, fail);
		}
	});
};


// -----------------------------------------------------------------------------
// Starts file "src/statements/rollback.js"
// -----------------------------------------------------------------------------
/** 
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {Function}
 * @example  * <pre style="font-family:Menlo, monospace">
 *
 *       ┌──────────┐         ┌─────────────┐  
 * >─────┤ ROLLBACK ├──────┬──┤ TRANSACTION ├──┬────────>
 *       └──────────┘      │  └─────────────┘  │
 *                         │                   │
 *                         └───────────────────┘
 * 
 * </pre>
 */ 
STATEMENTS.ROLLBACK = function(walker) {
	return new Task({
		name : "Rollback transaction",
		execute : function(done, fail) {
			if (walker.is("TRANSACTION"))
				walker.forward();
			
			walker.errorUntil(";");

			walker.commit(function() {
				SERVER.rollbackTransaction();
				done();
			});
		},
		undo : function() {
			SERVER.commitTransaction();
			done();
		}
	});
};


// -----------------------------------------------------------------------------
// Starts file "src/statements/source.js"
// -----------------------------------------------------------------------------

STATEMENTS.SOURCE = function(walker) {
	return new Task({
		name : "SOURCE Command",
		execute : function(done, fail) {
			var start = walker.current()[2],
				xhr,
				end,
				url;

			var string = [
				"@" + TOKEN_TYPE_SINGLE_QUOTE_STRING,
				"@" + TOKEN_TYPE_DOUBLE_QUOTE_STRING,
				"@" + TOKEN_TYPE_BACK_TICK_STRING
			].join("|");

			if (walker.is(string)) {
				url = walker.get().trim();
				walker.forward().errorUntil(";");
			} else {
				start = walker.current()[2];
				walker.nextUntil(";");
				end = walker.current()[2];
				url = walker._input.substring(start, end).trim();
			}
			
			walker.commit(function() {
				
				if (url) {
					xhr = new XMLHttpRequest();
					xhr.open("GET", url, true);
					xhr.onreadystatechange = function() {
						if (xhr.readyState == 4) {
							if (xhr.status == 200 || xhr.status == 304) {
								var queries = getQueries(xhr.responseText),
									len = queries.length;
								query(queries, function(result, idx) {
									if (idx === len - 1) {
										done(strf(
											'%s queries executed successfuly from file "%s"',
											len,
											url
										));
									}
								}, function(e, idx) {
									fail(e + " (query: " + queries[idx].sql + ")");
								});
							} else {
								fail(xhr.statusText);
							}
						}
					};
					xhr.send(null);
				}
			});
		},
		undo : function(done, fail) {
			console.warn("The SOURCE command cannot be undone!");
			done();
		}
	});
};

// -----------------------------------------------------------------------------
// Starts file "src/parser.js"
// -----------------------------------------------------------------------------
/**
 * Simple wrapper for query lists. Its an array but its instanceof QueryList
 * so it is useful for argument polymorphism... For example the 
 * normalizeQueryList can work with strings and arrays but if the input array is
 * a QueryList, then it is considered complete and not processed...
 */
function QueryList() {}
QueryList.prototype = [];

/**
 * Parses the string and returns a list of queries
 */
function getQueries(sql)
{
	var queries = new QueryList(),
		tokens  = getTokens(normalizeQueryList(sql), {
			skipComments : true,
			skipSpace    : true,
			skipEol      : true,
			skipStrQuots : true
		}),
		walker = new Walker(tokens, sql),
		start, end, tokLen = tokens.length, offset = 0, q, tok;

	function onToken(tok) {
		tok[2] += offset;
		tok[3] += offset;
		end = tok[3];
		q.tokens.push(tok);
	}

	while (walker._pos < tokLen - 1) {
		
		q = { sql : "", tokens : [] };

		// Set both markers to the start of the first token
		start = end = walker.current()[2];

		walker.nextUntil(";", onToken);

		// If the ";" is missing at the end of the last query consider it 
		// incomplete and abort the procedure
		if (!walker.is(";"))
			break;

		tok = walker.current();
		tok[2] += offset;
		end = tok[3];
		tok[3] += offset;
		q.tokens.push(tok);
		q.sql = sql.substring(start, end);
		if (q.sql && q.sql != ";")
			queries.push(q);
		offset = -end-1;

		if ( !walker.next() )
			break;
	}

	return queries;
}

/**
 * Converts the input to normalized SQL string. Appends missing semicolons at 
 * the end, trims, joins multiple queries etc. 
 * @param {String|Array} Can also be an array with nested arrays in which case
 * it will be recursive and produce a flat query list string
 * @return {Array}
 */
function normalizeQueryList(input) {
	return isArray(input) ? 
			input instanceof QueryList ?
				input : 
				input.map(normalizeQueryList).join("").trim() : 
			String(input).trim().replace(/(.*?);*?$/, "$1;");
}

/**
 * Executes the given SQL query and invokes the callback function which has the
 * "error-first" signature "function(error, result, queryIndex)".
 * @param {String} sql The SQL query (or multiple queries as string or as array)
 */
function query2(sql, callback) 
{
	query(sql, function(result, idx) {
		callback(null, result, idx);
	}, function(err, idx) {
		var error = error && error instanceof Error ?
			err : 
			new Error(String(err || "Unknown error"));
		callback(error, null, idx);
	});
}

function query(sql, onSuccess, onError) 
{
	var 

	// First we need to split the SQL into queries because the behavior is
	// very different for single vs multiple queries
	queries = sql instanceof QueryList ? sql : getQueries(sql),

	// The number of SQL queries
	len = queries.length,

	// The current query (inside iteration)
	currentQuery = null,

	// Just an iterator variable
	i = 0;

	//console.log("queries:");console.dir(queries);

	function onResult(result, queryIndex)
	{
		if (result !== undefined) {
			onSuccess(result, queryIndex || i);
		}
	}

	function onFailure(e, i)
	{
		(onError || defaultErrorHandler)(
			e && e instanceof Error ? 
				e : 
				new Error(String(e || "Unknown error")),
			i
		);
	}

	function q(name, walker, queryIndex, next)
	{
		return function() {
			var fn = STATEMENTS[name],
				tx = SERVER.getTransaction(),
				result = new Result(),
				task;
			
			if (tx) 
			{
				tx.add(Transaction.createTask({
					name : name,
					execute : function(done, fail) {
						var _result = new Result(), _task;
						try {
							_task = fn(walker);
							_task.execute(
								function(r) { 
									_result.setData(r);
									onResult(_result, queryIndex);
									done();
								}, 
								function(err) {
									_task.undo(noop, fail);
									fail(err);
								}
							);
						} catch (ex) {
							//_result = null;
							if (_task) {
								_task.undo(noop, fail);
							}
							fail(ex);
						}
					},
					undo : function(done, fail) {
						done();
					}
				}));
				result.setData(name + " query added to the transaction");
				onResult(result, queryIndex);
				next();
			}
			else
			{
				try {
					task = fn(walker);
					task.execute(
						function(r) {
							result.setData(r);
							onResult(result, queryIndex);
							next();
						}, 
						function(e) {
							//result = null;
							onFailure(e, queryIndex);
							task.undo(noop, function(err) {
								onFailure("Undo failed: " + err, queryIndex);
							});
						}
					);
				} catch (err) {
					onFailure(err, queryIndex);
				}
			}
		};
	}

	// Iterate over the queries
	// -------------------------------------------------------------------------
	function handleQueryAt(index) 
	{
		var currentQuery = queries[index];

		// All done already
		if (!currentQuery) 
			return;

		var next = function() {
			handleQueryAt(index + 1);
		};

		// Each query has it's own walker
		var walker = new Walker(currentQuery.tokens, currentQuery.sql);

		walker.pick({
				
			// The transaction control statements ------------------------------
			"BEGIN" : q("BEGIN", walker, index, next),

			"COMMIT|END" : function() {
				var tx = SERVER.getTransaction(), result;

				if (!tx) {
					onFailure("There is no transaction to commit", index);
					return;
				}

				result = new Result();

				if (tx.isEmpty()) {
					STATEMENTS.COMMIT(walker).execute(noop, onFailure);
					result.setData("Empty transaction committed");
					onResult(result, index);
					next();
				} else {
					result.setData("Transaction committed");
					onResult(result, index);
					tx.one("complete", function() {
						result.setData("Transaction complete");
						onResult(result, index);
						setTimeout(next, 0);
					});
					tx.one("rollback", function(err) {
						onFailure(
							"Transaction rolled back!" + 
							(err ? "\n" + err : ""), 
							index
						);
						setTimeout(next, 0);
					});
					STATEMENTS.COMMIT(walker).execute(noop, onFailure);
				}
			},

			"ROLLBACK" : function() {
				var tx = SERVER.getTransaction(), result;

				if (!tx) {
					onFailure("There is no transaction to rollback", index);
					return;
				}

				result = new Result();

				if (tx.isEmpty()) {
					STATEMENTS.ROLLBACK(walker).execute(noop, onFailure);
					result.setData("Empty transaction rolled back");
					onResult(result, index);
					next();
				} else {
					tx.one("rollback", function() {
						result.setData("Transaction rolled back!");
						onResult(result, index);
						setTimeout(next, 0);
					});
					STATEMENTS.ROLLBACK(walker).execute(noop, onFailure);
				}
			},

			// All the others --------------------------------------------------
			"SHOW" : function() {
				walker.pick({
					"DATABASES|SCHEMAS" : q("SHOW_DATABASES", walker, index, next),
					"TABLES"            : q("SHOW_TABLES"   , walker, index, next),
					"COLUMNS"           : q("SHOW_COLUMNS"  , walker, index, next)
				});
			},
			"CREATE" : function() {
				walker.pick({
					"DATABASE|SCHEMA" : q("CREATE_DATABASE", walker, index, next),
					"TABLE"           : q("CREATE_TABLE"   , walker, index, next),
					"TEMPORARY TABLE" : q("CREATE_TABLE"   , walker, index, next)
				});
			},
			"DROP" : function() {
				walker.pick({
					"DATABASE|SCHEMA" : q("DROP_DATABASE", walker, index, next),
					"TABLE"           : q("DROP_TABLE"   , walker, index, next),
					"TEMPORARY TABLE" : q("DROP_TABLE"   , walker, index, next)
				});
			},
			
			"SELECT"     : q("SELECT", walker, index, next),
			"USE"        : q("USE"   , walker, index, next),
			"UPDATE"     : q("UPDATE", walker, index, next),
			"INSERT"     : q("INSERT", walker, index, next),
			"DELETE"     : q("DELETE", walker, index, next),
			"SOURCE"     : q("SOURCE", walker, index, next)
		});
	}

	if (len) {
		try {
			handleQueryAt(0);
		} catch (err) {
			onFailure(err);	
		}
	} else {
		onSuccess(new Result("No queries executed"));
	}
}



// -----------------------------------------------------------------------------
// Starts file "src/storage/StorageBase.js"
// -----------------------------------------------------------------------------
/**
 * @classdesc The Storage is a singleton storage manager
 */
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
 * @constructor
 * @extends {StorageBase}
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

	/**
	 * Delete multiple items. If everything goes well, calls the onSuccess
	 * callback. Otherwise calls the onError callback.
	 * @param {Array} keys - An array of keys to delete
	 * @param {Function} onSuccess - This is called on success without arguments
	 * @param {Function} onError - This is called on error with the error as
	 * single argument
	 * @return {void} undefined - This method is async. so use the callbacks
	 */
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
 * @constructor
 * @extends {StorageBase}
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
/**
 * @constructor
 * @abstract
 * @classdesc The base class for persistable objects. Provides the basic methods
 * for key-value based async. persistance
 */
function Persistable() {}

Persistable.prototype = {
	
	/**
	 * The storage engine instance used by this object.
	 * @todo This should be configurable!
	 */
	storage : Storage.getEngine("LocalStorage"),
	
	/**
	 * The method that should generate and return the plain (JSON) 
	 * representation of the object. The subclasses must redefine it.
	 * @return {Object}
	 * @abstract
	 */
	toJSON : function() 
	{
		throw "Please implement the 'toJSON' method to return the JSON " + 
			"representation of the instance";
	},
	
	/**
	 * Each subclass must define it's own storage key which is the key used for
	 * the key-value base storage
	 * @abstract
	 * @return {String}
	 */
	getStorageKey : function()
	{
		throw "Please implement the 'getStorageKey' method to return the " + 
			"storage key";
	},
	
	/**
	 * This method attempts to read the serialized version of the instance from
	 * the storage and parse it to JS Object
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
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
	
	/**
	 * Saves the data in the storage.
	 * @param {Object|Array} data - The data to store
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
	write : function(data, onSuccess, onError)
	{
		this.storage.set(
			this.getStorageKey(), 
			JSON.stringify(data), 
			onSuccess, 
			onError 
		);
	},
	
	/**
	 * Deletes the corresponding data from the storage.
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
	drop : function(onSuccess, onError)
	{
		this.storage.unset(this.getStorageKey(), onSuccess, onError);
	},
	
	/**
	 * Saves the instance (as JSON) in the storage.
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
	save : function(onSuccess, onError) 
	{
		this.write( this.toJSON(), onSuccess, onError );
	},
	
	/**
	 * Reads the corresponding data from the storage.
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
	load : function(onSuccess, onError)
	{
		this.read(onSuccess, onError);
	}
};



// -----------------------------------------------------------------------------
// Starts file "src/Server.js"
// -----------------------------------------------------------------------------
/**
 * @constructor
 * @classdesc The Server class is used to create a single instance that is a 
 * persistable collection of databases.
 * @extends {Persistable}
 */
function Server()
{
	var transaction = null;

	/**
	 * The databases currently in this server
	 * @type {Object}
	 * @private
	 */
	this.databases = {};

	// Transaction management methods ------------------------------------------

	/**
	 * Checks whether there is a pending transaction
	 * @return {Boolean}
	 */
	this.isInTransaction = function()
	{
		return !!transaction;
	};

	/**
	 * Gets the current transaction (if any)
	 * @return {Transaction|null}
	 */
	this.getTransaction = function()
	{
		return transaction || null;
	};

	/**
	 * Starts new transaction
	 */
	this.beginTransaction = function(options)
	{
		if (transaction)
			throw new SQLRuntimeError(
				"There is a current transaction already started"
			);

		transaction = new Transaction(options);

		function removeTransaction() {
			transaction.destroy();
			transaction = null;
		}
		
			
		transaction.on("rollback", function(error) {
			console.log("Transaction rolled back with error ", error);
			removeTransaction();
		});

		transaction.on("complete", function() {
			console.log("Transaction complete");
			removeTransaction();
		});

		transaction.on("before:task", function(task, pos) {
			console.log("Starting task ", task.name);
		});
		
		transaction.on("after:task", function(task, pos) {
			console.log("Ended task ", task.name);
		});

		return transaction;
	};

	this.commitTransaction = function()
	{
		if (!transaction)
			throw new SQLRuntimeError("There is no current transaction");

		transaction.start();

	};

	this.rollbackTransaction = function(done, fail)
	{
		if (!transaction) {
			var err = new SQLRuntimeError("There is no current transaction");
			if (fail)
				fail(err);
			else
				throw err;
		}

		if (done)
			transaction.one("rollback", done);
		if (fail)
			transaction.one("error", fail);

		transaction.rollback();
	};
}

Server.prototype = new Persistable();
Server.prototype.constructor = Server;

/**
 * Return the storage key for the server object. This is used to identify it
 * inside a key-value based storage.
 * @return {String}
 */
Server.prototype.getStorageKey = function()
{
	return NS;
};

/**
 * Overrides {@link Persistable.prototype.toJSON}
 * @return {Object}
 */
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
						inst.loaded = true;
						onSuccess.call(inst);
					}
				};
			}

			// Clear current databases (if any)
			inst.databases = {};


			if (json.databases) {
				for ( dbName in json.databases ) {
					if (json.databases.hasOwnProperty(dbName)) {
						db = new Database(dbName);
						databases[dbCount++] = db;
					}
				}
			}

			if (dbCount > 0) {
				for ( i = 0; i < dbCount; i++ ) {
					db = databases[i];
					db.load(onDatabaseLoad(db), onError);
				}
			} else {
				inst.loaded = true;
				JSDB.events.dispatch("load:server", inst);
				onSuccess.call(inst);
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
 * @return {void}
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

/**
 * Drops a database from the server.
 * @param {String} name The name of the database to drop
 * @param {Boolean} ifNotExists Note that an exception will be thrown if such 
 * database does not exists and this is not set to true.
 * @return {void}
 */
Server.prototype.dropDatabase = function(name, ifExists, done, fail) 
{
	if (this.databases.hasOwnProperty(name)) {
		if (this.currentDatabase === this.databases[name])
			this.currentDatabase = null;
		this.databases[name].drop();
		delete this.databases[name];
		this.save(done, fail);
	} else {
		if (!ifExists) {
			var err = new SQLRuntimeError('Database "' + name + '" does not exist');
			if (fail)
				return fail(err);
			else 
				throw err;
		}
		if (done)
			done();
	}
};

/**
 * Get a database by name.
 * @param {String} name - The name of the desired database
 * @return {Database|undefined}
 */
Server.prototype.getDatabase = function(name)
{
	return this.databases[
		trim(name)
	];
};

/**
 * Selects the specified database as the currently used one.
 * @throws {SQLRuntimeError} error If the databse does not exist
 * @return {Server} Returns the Server instance
 */
Server.prototype.setCurrentDatabase = function(name)
{
	var db = trim(name);
	if (!this.databases.hasOwnProperty(db)) {
		throw new SQLRuntimeError('No such database "%s".', db);
	}
	CURRENT_DATABASE = this.currentDatabase = this.databases[db];
	return this;
};

/**
 * Returns the currently used database (if any).
 * @return {Database|undefined}
 */
Server.prototype.getCurrentDatabase = function()
{
	return this.currentDatabase;
};


// -----------------------------------------------------------------------------
// Starts file "src/Database.js"
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                             Class Database                                 //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @classdesc The Server class is used to create databses which are persistable 
 * collections of tables.
 * @extends {Persistable}
 */
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

/**
 * Get a table by name from the database.
 * @param {String} name - The name of the desired table
 * @return {Table}
 * @throws {SQLRuntimeError} error - If there is no such table
 */
Database.prototype.getTable = function(tableName)
{			
	var table = this.tables[tableName];
	if (!table) {
		throw new SQLRuntimeError(
			'No such table "%s" in database "%s"',
			tableName,
			this.name
		);
	}
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

/**
 * @constructor
 */
function Table(tableName, db) 
{
	/**
	 * The name of the table
	 * @type String
	 */
	this.name = tableName;
	
	/**
	 * Collection of TableRow instances by sequence
	 * @type Object
	 */
	this.rows = {};

	/**
	 * The indexes of the table
	 * @type Object
	 */
	this.keys = {};

	/**
	 * Collection of Column instances by name
	 * @type Object
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

/*
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
*/

/**
 * Generates and returns the JSON representation of the table object. This is 
 * mostly used by the "save procedure".
 * @todo The rows property might contain only the IDs instead of full keys
 * @return {Object}
 */
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

/**
 * Overrides the Persistable.prototype.getStorageKey method. Generates and 
 * returns the key to be used as storage key. The key represents the full path
 * to the table expressed as "{namespace}.{database name}.{table name}".
 * @return {String}
 */
Table.prototype.getStorageKey = function() 
{
	return [NS, this._db.name, this.name].join(".");
};

/**
 * Add constraint to the table. This can be used if the columns are already
 * known and created. Creates an index and updates the Column object(s) to refer
 * to it...
 */
Table.prototype.addConstraint = function(props)
{
	if (props.type == TableIndex.TYPE_INDEX  ||
		props.type == TableIndex.TYPE_UNIQUE ||
		props.type == TableIndex.TYPE_PRIMARY) 
	{
		var key = TableIndex.fromJSON(props, this);
		this.keys[key.name] = key;
		
		for (var i = 0, l = props.columns.length; i < l; i++)
		{
			this.cols[props.columns[i]].setKey(props.type);
		}
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

/**
 * Overrides the Persistable.prototype.save method. Saves the table and when 
 * done, also saves the database that this table belongs to.
 * @param {Function} onSuccess
 * @param {Function} onError
 * @return {void}
 * @emits savestart:table - Before the save procedure is started
 * @emits save:table - If the save finishes successfully
 */
Table.prototype.save = function(onComplete, onError) 
{
	var db = this._db, table = this;
	JSDB.events.dispatch("savestart:table", table);
	Persistable.prototype.save.call(this, function() {
		db.save(function() {
			JSDB.events.dispatch("save:table", table);
			if ( isFunction(onComplete) ) {
				onComplete();
			}
		}, onError);	
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
		//console.dir(row);

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

/**
 * Updates table row(s)
 */
Table.prototype.update = function(map, alt, where, onSuccess, onError)
{
	// The UPDATE can be canceled if a "beforeupdate:table" listener returns false 
	if (!JSDB.events.dispatch("beforeupdate:table", this)) {
		onError(new SQLRuntimeError(
			'The UPDATE procedure of table "%s" was canceled by a "beforeupdate:table" event listener',
			this.getStorageKey()
		));
		return;
	}
	
	var table = this, 
		trx = new Transaction({
			name         : "Update " + table.name + " transaction",
			autoRollback : false,
			onError      : handleConflict,
			onComplete   : function() {
				JSDB.events.dispatch("update:table", table);
				onSuccess();
			}
		});

	// ROLLBACK|ABORT|REPLACE|FAIL|IGNORE
	function handleConflict(error)
	{
		if (error && error instanceof SQLConstraintError) 
		{
			switch (alt) {

				// When an applicable constraint violation occurs, the ROLLBACK 
				// resolution algorithm aborts the current SQL statement with an 
				// SQLConstraintError and rolls back the current transaction. 
				// If no transaction is active (other than the implied 
				// transaction that is created on every command) then the 
				// ROLLBACK resolution algorithm works the same as the ABORT 
				// algorithm.
				case "ROLLBACK":
					trx.setOption("reqursiveRollback", true);
					trx.one("rollback", function() {
						if (onError) onError(error);
						console.info("Update lolled back!");
					});
					trx.rollback();
				break;

				// When an applicable constraint violation occurs, the FAIL 
				// resolution algorithm aborts the current SQL statement with an 
				// SQLConstraintError. But the FAIL resolution does not back out 
				// prior changes of the SQL statement that failed nor does it 
				// end the transaction. For example, if an UPDATE statement 
				// encountered a constraint violation on the 100th row that it 
				// attempts to update, then the first 99 row changes are 
				// preserved but changes to rows 100 and beyond never occur.
				case "FAIL":
					if (onError) 
						onError(error);
				break;

				// When an applicable constraint violation occurs, the IGNORE 
				// resolution algorithm skips the one row that contains the 
				// constraint violation and continues processing subsequent rows 
				// of the SQL statement as if nothing went wrong. Other rows 
				// before and after the row that contained the constraint 
				// violation are inserted or updated normally. No error is 
				// returned when the IGNORE conflict resolution algorithm is used.
				case "IGNORE":
					trx.next();
				break;

				// 
				case "REPLACE":
				break;

				// When an applicable constraint violation occurs, the ABORT 
				// resolution algorithm aborts the current SQL statement with an 
				// SQLConstraintError error and backs out any changes made by 
				// the current SQL statement; but changes caused by prior SQL 
				// statements within the same transaction are preserved and the 
				// transaction remains active. This is the default behavior and 
				// the behavior specified by the SQL standard.
				default: // ABORT
					trx.setOption("reqursiveRollback", false);
					trx.one("rollback", function() {
						if (onError) onError(error);
						console.info("Update lolled back!");
					});
					trx.rollback();
				break;				
			}
		}
		else
		{
			if (onError) 
				onError(error);
		}
	}

	each(table.rows, function(row, id) {
		//debugger;
		var newRow = row.toJSON(), name;

		// Skip rows that don't match the WHERE condition if any
		if (where && !executeCondition( where, newRow ))
		{
			return true;
		}

		// Create the updated version of the row
		//for ( name in map )
		//{
		//	newRow[name] = executeCondition(map[name], newRow);
		//}

		// The UPDATE can be canceled on row level if a "before_update:row" 
		// listener returns false 
		//if (!JSDB.events.dispatch("before_update:row", row))
		//{
		//	return true;
		//}

		// Update table indexes
		//for (var ki in table.keys) 
		//{
		//	table.keys[ki].beforeUpdate(row, newRow);
		//}
		
		// Update the actual row
		//for ( name in map )
		//{
		//	row.setCellValue( name, newRow[name] );
		//}

		(function(row, newRow) {

			var rowBackUp = row.toJSON();
			
			var task = Transaction.createTask({
				name : "Update row " + row.getStorageKey(),
				execute : function(done, fail)
				{
					var name;

					// Create the updated version of the row
					for ( name in map )
					{
						newRow[name] = executeCondition(map[name], newRow);
					}

					// The UPDATE can be canceled on row level if a 
					// "before_update:row" listener returns false 
					if (!JSDB.events.dispatch("before_update:row", row))
					{
						done();
						return true;
					}

					// Update table indexes
					for (var ki in table.keys) 
					{
						table.keys[ki].beforeUpdate(row, newRow);
					}

					// Update the actual row
					for ( name in map )
					{
						row.setCellValue( name, newRow[name] );
					}

					done();
				},
				undo : function(done)
				{
					for ( var name in rowBackUp )
						row.setCellValue( name, rowBackUp[name] );
					done();
				}
			});

			trx.add(task);

		})(row, newRow);
	});
	
	trx.start();
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

/**
 * Returns table rows (usually a filtered subset). This method is mostly used to 
 * get a set of rows that are going to be updated with UPDATE query or deleted 
 * with DELETE query.
 * @param {String} filter - What to include. Can be:
 * <ul>
 *   <li>String "*" - Use "*" to get all the rows of the table</li>
 *   <li>Number|numeric - The index of the row to include.</li>
 *   <li>String   - The key of single row that should be included</li>
 *   <li>Number   - The index of the row to include</li>
 *   <li>TableRow - The row to be included</li>
 *   <li>Array    - Array of row keys to include multiple rows</li>
 * </ul>
 * @return {Object} 
 * @example
 * // Get all rows of table
 * table.getRows("*");
 *
 * // Get row at index
 * table.getRows(2);
 * table.getRows("3");
 *
 * // Single row by storage key
 * table.getRows("JSDB.tests.City.16");
 *
 * // An array of any of the above
 * table.getRows([2, "3", "JSDB.tests.City.16", 50]);
 *//*
Table.prototype.getRows = function(filter)
{
	var out = {}, row;

	// All
	if ( filter == "*" )
	{
		out = this.rows;
	}

	// The index of the row to delete
	else if ( isNumeric(filter) )
	{
		filter = intVal(filter, -1);
		if ( filter >= 0 && filter < this._row_seq.length )
		{
			row = this._row_seq[filter];
			out[ row.id ] = row;
		}
	}

	// Single row by storage key
	else if ( typeof filter == "string" )
	{
		filter = filter.replace(/^.*?[^\.]$/, "");
		row    = this.rows[ intVal(filter) + "" ];
		if ( row )
		{
			out[ row.id ] = row;
		}
	}

	// Array of the above
	else if ( isArray(filter) )
	{
		for ( var i = 0, l = filter.length; i < l; i++ )
		{
			mixin(out, this.getRows( filter[i] ));
		}
	}

	return out;
};*/

/**
 * Deletes rows from the table.
 * @param {String} what - What to delete. Can be:
 * <ul>
 *   <li>String   - The key of single row that should be deleted</li>
 *   <li>Number   - The index of the row to delete</li>
 *   <li>TableRow - The row to be deleted</li>
 *   <li>Array    - Array of row keys to delete multiple rows</li>
 * </ul>
 * @param {Function} onSuccess
 * @param {Function} onError
 * @return {void}
 */
Table.prototype.deleteRows = function(rows, onComplete, onError)
{
	var table = this,
		keys  = [];
	
	rows = makeArray(rows);

	each(rows, function(row) {
		keys.push(row.getStorageKey());
	});

	// Delete row from the storage
	table.storage.unsetMany(keys, function() {
		
		// Delete row from memory
		each(rows, function(row) {

			for (var ki in table.keys) {
				table.keys[ki].beforeDelete(row);
			}

			var i = binarySearch(table._row_seq, row.id, TableIndex.compare);
			if (i >= 0)
			{
				delete table.rows[row.id];
				table._row_seq.splice(i, 1);
			}
		});

		keys = null;

		table.save(function() {
			if (onComplete) 
				onComplete();
		}, onError);
	}, onError);
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
	"ENUM" : Column_ENUM, // (value1,value2,value3,...)[CHARACTER SET charset_name] [COLLATE collation_name]
	//"SET" : {}//, // (value1,value2,value3,...)[CHARACTER SET charset_name] [COLLATE collation_name]
	//"spatial_type"
};

/**
 * @classdesc Represents a column which is an abstract object resposible for 
 * handling the datatype constraints
 * @constructor
 */
function Column() 
{
	/**
	 * The arguments for the data type. If the column type support some 
	 * arguments they will be stored here.
	 * @type {Array}
	 */
	this.typeParams = [];
}

/**
 * A map the supported SQL data types and the corresponding constructor function
 * that should create an instance of the given column type.
 * @type {Object}
 * @static
 * @readonly
 */
Column.constructors = columnDataTypes;

Column.prototype = {

	/**
	 * The type of the key that this column belongs to (if any). Can be "KEY",
	 * "INDEX", "UNIQUE", "PRIMARY" or undefined.
	 * @type {String}
	 * @default undefined
	 */
	key : undefined,

	/**
	 * The name of the column. This should not be set directly. The setName
	 * method should be used instead.
	 * @type {String}
	 * @default null - Initially null
	 */
	name : null,

	/**
	 * Many of the Column subclasses have "length" property. This just provides
	 * the default base value of -1, meaning that no length has been specified.
	 * @type {Number}
	 */
	length : -1,
	
	/**
	 * The type of the Column object. This only provides the base value for all
	 * the subclasses. Each of the concrete subclasses must redefine this to a
	 * value that matches it's type (One of the keys in Column.constructors).
	 * @abstract
	 * @type {String} 
	 * @default null
	 */
	type : null,

	/**
	 * This flag indicates if the column can be set to null
	 * @type {Boolean}
	 * @default null
	 */
	nullable : false,

	/**
	 * The setter method for the name property. The name argument will be 
	 * converted to string and trimmed before setting it.
	 * @param {String} name - The name to set.
	 * @return {Column} Returns the instance.
	 * @throws {SQLRuntimeError} exception - If the provided name is not valid.
	 */
	setName : function(name)
	{
		if (name) 
		{
			name = trim(name);
			if (name) 
			{
				this.name = name;
				return this;
			}
		}
		
		throw new SQLRuntimeError('Invalid column name "%s".', name);
	},

	/**
	 * Sets the key property of the column instance.
	 * @param {String|Number} key - The type of the key to set. Can be:
	 * <ul>
	 *   <li><b>KEY</b> or <b>INDEX</b> or TableIndex.TYPE_INDEX to mark the column as indexed</li>
	 *   <li><b>UNIQUE</b> or TableIndex.TYPE_UNIQUE to mark the column as unique</li>
	 *   <li><b>PRIMARY</b> or TableIndex.TYPE_PRIMARY to mark the column as primary key</li>
	 * </ul>
	 * If the argoment does not match any of the above, the key property will 
	 * be reset back to undefined value.
	 * @return {void}
	 */
	setKey : function(key) 
	{
		var keyStr = String(key).toUpperCase();

		if (key === TableIndex.TYPE_INDEX)
		{
			this.key = "INDEX";
		}
		else if (keyStr == "INDEX" || keyStr == "KEY")
		{
			this.key = keyStr;
		}
		else if (key === TableIndex.TYPE_UNIQUE || keyStr == "UNIQUE")
		{
			this.key = "UNIQUE";
		}
		else if (key === TableIndex.TYPE_PRIMARY || keyStr == "PRIMARY") 
		{
			this.key = "PRIMARY";
		} 
		else 
		{
			this.key = undefined;
		}
	},

	/**
	 * Sets the default value of the column.
	 * @param {String|Number|undefined} val - The default value. The argument 
	 * can be undefined to clear the default value, or anything else to be used
	 * as default. Note that (if not undefined) the value will be applied using
	 * the "set" method which means that all the validation rules will be 
	 * applied and an exception might be thrown if the value is not acceptable.
	 * @return {void}
	 */
	setDefaultValue : function(val) 
	{
		this.defaultValue = val === undefined ? 
			val : 
			this.set(val);
	},

	/**
	 * The initialization method. Sets the name, key, defaultValue and nullable
	 * properties of the instance.
	 * @param {Object} options - The options object must contain the "name" 
	 * property and may also include "key", "defaultValue" and "nullable"
	 * properties.
	 * @return {Column} Returns the instance
	 */
	init : function(options) 
	{
		this.setName(options.name);
		this.setKey(options.key);
		this.setDefaultValue(options.defaultValue);
		this.nullable = !!options.nullable;
		return this;
	},

	/**
	 * This is the basic version of the toJSON method. Many Column subclasses
	 * are using it as is, but some of them redefine it to match their custom
	 * needs.
	 * @return {Object} The JSON representation of the column
	 */
	toJSON : function() 
	{
		var json = {
			name : this.name,
			key      : this.key,
			defaultValue : this.defaultValue,
			nullable : !!this.nullable,
			type : {
				name : this.type,
				params : this.typeParams.slice()
			}
		};
		
		return json;
	},

	/**
	 * This is the basic version of the typeToSQL method. Many Column subclasses
	 * are using it as is, but some of them redefine it to match their custom
	 * needs.
	 * @return {String} The SQL representation of the column
	 */
	typeToSQL : function() 
	{
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

/**
 * The column factory function. Creates and returns an instance of one of the 
 * available Column subclasses.
 * @param {Object}  options - Might have various properties:
 * @param {Object}  options.type
 * @param {String}  options.type.name - The name of the data type
 * @param {Array}   options.type.params - The data type parameters (if any)
 * @param {Boolean} options.unsigned - For numeric columns only
 * @param {Boolean} options.autoIncrement - For numeric columns only
 * @param {Boolean} options.zerofill - For numeric columns only
 * @static
 */
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
	inst.init(options);
	//inst.typeParams = options.type.params || [];
	return inst;
};

////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                           NUMERIC COLUMNS                                  //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////

/** 
 * @classdesc Class NumericColumn extends Column. Thais is the basic class for 
 * all numeric data types.
 * @constructor
 * @extends Column
 */
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

/**
 * Overrides the parent init method so that the numeric columns will also 
 * initialize their "autoIncrement", "zerofill" and "unsigned" properties.
 * @param {Object}  options - Might have various properties:
 * @param {Object}  options.type
 * @param {String}  options.type.name - The name of the data type
 * @param {Array}   options.type.params - The data type parameters (if any)
 * @param {Boolean} options.unsigned - For numeric columns only
 * @param {Boolean} options.autoIncrement - For numeric columns only
 * @param {Boolean} options.zerofill - For numeric columns only
 * @static
 */
NumericColumn.prototype.init = function(options) 
{
	this.setUnsigned(options.unsigned);
	
	if ( isArray(options.type.params) && options.type.params.length > 0 ) {
		this.setLength(options.type.params[0]);
		this.typeParams = [this.length];
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
 * @classdesc The BIT data type is used to store bit-field values. A type of 
 * BIT(M) enables storage of M-bit values. M can range from 1 to 64.
 * To specify bit values, b'value' notation can be used. value is a binary 
 * value written using zeros and ones. For example, b'111' and b'10000000' 
 * represent 7 and 128, respectively. 
 * If you assign a value to a BIT(M) column that is less than M bits long, 
 * the value is padded on the left with zeros. For example, assigning a 
 * value of b'101' to a BIT(6) column is, in effect, the same as assigning 
 * b'000101'.
 * @constructor
 * @extends {NumericColumn}
 * @todo Enable the "b'xxx'" syntax
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
/**
 * @classdesc Class Column_INT extends NumericColumn
 * @constructor
 * @extends {NumericColumn}
 */
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
/**
 * @classdesc Class Column_INTEGER extends Column_INT. This is an alias of
 * Column_INT. The only difference is that the "type" property is set to 
 * "INTEGER" instead of "INT".
 * @constructor
 * @extends {Column_INT}
 */
function Column_INTEGER() {}
Column_INTEGER.prototype             = new Column_INT();
Column_INTEGER.prototype.constructor = Column_INTEGER;
Column_INTEGER.prototype.type        = "INTEGER";


// Column_TINYINT extends Column_INT
// =============================================================================
/**
 * @classdesc Class Column_TINYINT extends Column_INT
 * @constructor
 * @extends {Column_INT}
 */
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
/**
 * @classdesc Class Column_SMALLINT extends Column_INT
 * @constructor
 * @extends {Column_INT}
 */
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
/**
 * @classdesc Class Column_MEDIUMINT extends Column_INT
 * @constructor
 * @extends {Column_INT}
 */
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
/**
 * @classdesc Class Column_BIGINT extends Column_INT
 * @constructor
 * @extends {Column_INT}
 */
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
Column_DOUBLE.prototype.decimals    = 2;
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
	this.typeParams = [this.length];
	if ( isArray(options.type.params) ) {
		if (options.type.params.length > 2) {
			throw new SQLRuntimeError(
				'Invalid data type declaration for column "%s". The syntax ' + 
				'is "%s[(length[, decimals])]".',
				options.name,
				this.type.toUpperCase()
			);
		}

		this.typeParams = [];
		if (options.type.params.length > 0) {
			this.setLength(options.type.params[0]);
			this.typeParams[0] = this.length;
		}

		if (options.type.params.length > 1) {
			this.decimals = intVal(options.type.params[1]);
			this.typeParams[1] = this.decimals;
		}
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

// Column_ENUM extends StringColumn
// =============================================================================
/**
 * @constructor
 * @extends {StringColumn}
 */
function Column_ENUM() {}

Column_ENUM.prototype             = new StringColumn();
Column_ENUM.prototype.constructor = Column_ENUM;

Column_ENUM.prototype.type = "ENUM";

Column_ENUM.prototype.setLength = function(n) {};

/**
 * The initialization of ENUM columns requires at least one option to be 
 * specified in the options.type.params array.
 */
Column_ENUM.prototype.init = function(options) 
{
	if ( !isArray(options.type.params) || options.type.params.length < 1 ) 
	{
		throw new SQLRuntimeError(
			'The "%s" column type requires at least one option.',
			this.type
		);
	}

	this.typeParams = options.type.params.slice();
	Column.prototype.init.call(this, options);	
};

/**
 * Setting a value on ENUM column requires that that value is present in the
 * options list. Otherwise an exception is thrown.
 * @param {String|Number} value - The value to set
 * @return {String} - The value that has been set as string
 * @throws {SQLRuntimeError} exception - If the value is invalid
 */
Column_ENUM.prototype.set = function(value) 
{
	var s = String(value);
	if (this.typeParams.indexOf(s) == -1) 
	{
		throw new SQLRuntimeError(
			'The value for column "%s" must be %s.',
			this.name,
			prettyList(this.optionSet)
		);
	}
	
	return s;
};

/**
 * Overrides the basic typeToSQL method so that the ENUM columns include their
 * options as comma-separated list in brackets after the type name.
 * @return {String} - The SQL representation of the column
 */
Column_ENUM.prototype.typeToSQL = function() {
	var sql = [this.type];
	if (this.typeParams.length) {
		sql.push("(");
		for (var i = 0, l = this.typeParams.length; i < l; i++) {
			sql.push(quote(this.typeParams[i], "'"));
			if (i < l - 1)
				sql.push(", ");
		}
		sql.push(")");
	}
	return sql.join("");
};




// -----------------------------------------------------------------------------
// Starts file "src/TableRow.js"
// -----------------------------------------------------------------------------
/**
 * Represents a table row which is a managed collection of TableCell objects.
 * @param {Table} table (optional; can be set later too)
 * @constructor
 * @return {TableRow}
 * @extends Persistable
 */
function TableRow(table, id)
{
	/**
	 * The id of the row is just it's sequence number provided by the contaning
	 * Table instance.
	 * @type Number
	 * @readonly
	 */
	this.id = id;

	/**
	 * The Table of this row
	 * @type Table
	 */
	this.table = null;

	/**
	 * The length of the row, i.e. the number of the cells inside it.
	 * IMPORTANT: Must me treated as read-only
	 * @type Number
	 * @readonly
	 */
	this.length = 0;

	/**
	 * The actual data collection
	 * @type Array
	 * @private
	 */
	this._data = [];
	
	/**
	 * The collection of TableCell objects by name
	 * @type Object
	 * @private
	 */
	this._cellsByName = {};

	if (table) {
		this.setTable(table);
	}
}

TableRow.prototype = new Persistable();
TableRow.prototype.constructor = TableRow;

/**
 * Overrides the Persistable.prototype.getStorageKey method. Generates and 
 * returns the key to be used as storage key.
 * @return {String}
 */
TableRow.prototype.getStorageKey = function()
{
	return [
		NS, 
		this.table._db.name, 
		this.table.name,
		this.id
	].join(".");
};

/**
 * Loads the row data from the storage.
 * @emits loadstart:row - before the loading starts
 * @emits load:row - If the load was successfully completed
 * @return {void} This method is async. Use the callback instead of relying on 
 * 		return value.
 * @param {Function} onSuccess - The callback to be invoced upon successfull 
 * load. It will be called with the row object as a single argument.
 * @param {Function} onError - The callback to be invoced upon failure. It will
 *		be called with the Error object as a single argument.
 */
TableRow.prototype.load = function(onSuccess, onError)
{
	var row = this;
	JSDB.events.dispatch("loadstart:row", row);
	this.read(function(json) {
		if (json) {
			for (var i = 0; i < row.length; i++) {
				row._data[i] = row.table.cols[row.table._col_seq[i]].set(json[i]);
			}
		}
		JSDB.events.dispatch("load:row", row);
		onSuccess(row);
	}, onError);
};

/**
 * Saves the row data to the storage.
 * @emits savestart:row - before the saving starts
 * @emits save:row - If the save was successfully completed
 * @return {void} This method is async. Use the callback instead of relying on 
 * 		return value.
 * @param {Function} onSuccess - The callback to be invoced upon successfull 
 * load. It will be called with the row object as a single argument.
 * @param {Function} onError - The callback to be invoced upon failure. It will
 *		be called with the Error object as a single argument.
 */
TableRow.prototype.save = function(onSuccess, onError)
{
	var row = this;
	JSDB.events.dispatch("savestart:row", row);
	row.write( this._data, function() {
		JSDB.events.dispatch("save:row", row);
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
	var colName, col;

	assertInstance(table, Table);
	
	this.length = 0;
	this._cellsByName = {};
	this.table = table;
	this._data = [];

	for (colName in table.cols) 
	{
		col = table.cols[colName];
		this._cellsByName[colName] = this.length;
		this.setCellValue(
			this.length++, 
			col.defaultValue === undefined ? null : col.defaultValue
		);
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
	return this._data[this._cellsByName[name]];
};

/**
 * Returns a reference to one of the TableCells in the row by it's index.
 * @throws RangeError if the cell does not exist
 * @return {TableCell}
 */
TableRow.prototype.getCellAt = function(index)
{
	assertInBounds(index, this._data, 'No field at index "' + index + '".');
	return this._data[index];
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
	var col;
	
	if (isNumeric(nameOrIndex)) {
		col   = this.table.cols[this.table._col_seq[nameOrIndex]];
		value = col.set(value);
		if (value === null && col.autoIncrement) {
			value = this.table._ai;
		}
		this._data[nameOrIndex] = value;
	}
	else {
		col   = this.table.cols[nameOrIndex];
		value = col.set(value);
		if (value === null && col.autoIncrement) {
			value = this.table._ai;
		}
		this._data[this._cellsByName[nameOrIndex]] = value;
	}
	
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
		this.getCellAt(nameOrIndex) : 
		this.getCell(nameOrIndex);
};

/**
 * Creates and returns the plain object representation of the instance.
 * @return {Object}
 */
TableRow.prototype.toJSON = function(mixed) 
{
	var json = {};
	for (var x in this._cellsByName) {
		json[x] = this._data[this._cellsByName[x]];
	}
	if (mixed) {
		for ( var i = 0; i < this.length; i++ ) {
			json[i] = this._data[i];
		}	
	}
	return json;
};


// -----------------------------------------------------------------------------
// Starts file "src/TableIndex.js"
// -----------------------------------------------------------------------------

/**
 * The standard index type is "INDEX".
 * @type Number
 * @constant
 * @static
 */
TableIndex.TYPE_INDEX = 2;

/**
 * The "UNIQUE" index works like the standard index but also 
 * checks for duplicated values before insert and update and
 * throws exceptions if such are found.
 * @type Number
 * @constant
 * @static
 */
TableIndex.TYPE_UNIQUE = 4;

/**
 * The "PRIMARY" index is an unique key but it also ensures that there is only
 * one PRIMARY KEY per table
 * @constant
 * @static
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
	/**
	 * An array of the names of the columns that are included in this index.
	 * @type Array
	 */
	this.columns = [];

	/**
	 * The actual index that is just a sorted array of row IDs.
	 * @type Array
	 * @private
	 */
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
				row.push( allRows[id].getCell(this.columns[y]) );
			}
			row = row.join("");

			idx = binarySearch(this._index, row, TableIndex.compare);
			this._index.splice(idx < 0 ? -idx - 1 : idx + 1, 0, row);
		}
	},

	/**
	 * Gets the indexed value for the given row. For multicolumn indexes this 
	 * is a concatenation of all the column values.
	 * @param {TableRow|Object} row
	 * @return {String} 
	 */
	getValueForRow : function(row)
	{
		var value = "", l = this.columns.length, i;

		if (l === 0)
			return value;

		if (l === 1)
			return String(
				row instanceof TableRow ? 
				row.getCell(this.columns[0]) :
				row[this.columns[0]]
			);

		for ( i = 0; i < l; i++ ) 
			value.push( 
				row instanceof TableRow ? 
				row.getCell(this.columns[i]) :
				row[this.columns[i]]
			);

		return value.join("");
	},

	/**
	 * Updates the index state to reflect the table contents. The table calls 
	 * this before INSERT.
	 * @param {TableRow} row The row that is about to be inserted
	 * @return void
	 */
	beforeInsert : function(row)
	{
		var value = [], y, i;

		for ( y = 0; y < this.columns.length; y++ ) 
		{
			value.push( row.getCell(this.columns[y]) );
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

	/**
	 * Updates the index state to reflect the table contents. The table calls 
	 * this before UPDATE.
	 * @param {TableRow} row The row that is about to be updated
	 * @return void
	 */
	beforeUpdate : function(oldRow, newRow) 
	{
		var oldVal = this.getValueForRow(oldRow),
			newVal = this.getValueForRow(newRow),
			oldIdx,
			newIdx;

		// If there is no change - just exit
		if ( oldVal === newVal )
			return;

		oldIdx = binarySearch(this._index, oldVal, TableIndex.compare);
		newIdx = binarySearch(this._index, newVal, TableIndex.compare);

		// Check for duplacting unique values
		if (newIdx >= 0 && this.isUnique())
		{
			throw new SQLConstraintError(
				'Constraint "%s" violated. The value must be unique and the ' +
				'supplied value "%s" already exists.',
				this.name,
				newVal
			);
		}

		//console.log(
		//	"old ", oldVal, " -> ", oldIdx, "(", this._index, ")\n",
		//	"new ", newVal, " -> ", newIdx, "(", this._index, ")"
		//);

		// Even changed, the new value might still remain on it's current position
		if (oldIdx === newIdx)
			return;

		newIdx = newIdx < 0 ? -newIdx - 1 : newIdx + 1;

		this._index.splice(newIdx, 0, newVal); // insert the new key

		// After the new key has been inserted make sure to correct the oldIdx
		// if needed
		oldIdx = oldIdx >= newIdx ? oldIdx + 1 : oldIdx;

		this._index.splice(oldIdx, 1); // remove the old key
	},

	/**
	 * Deletes the corresponding entry from the index. The table calls 
	 * this before DELETE.
	 * @param {TableRow} row The row that is about to be deleted
	 * @return void
	 */
	beforeDelete : function(row) 
	{
		var value = [], i;

		for ( i = 0; i < this.columns.length; i++ ) 
			value.push( row.getCell(this.columns[i]) );

		value = value.join("");

		i = binarySearch(this._index, value, TableIndex.compare);
		
		if ( i >= 0 )
			this._index.splice(i, 1);
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
GLOBAL[NS] = JSDB;

JSDB.query  = query;
JSDB.Result = Result;
JSDB.query2 = query2;

if ( GLOBAL.JSDB_EXPORT_FOR_TESTING ) {
	mixin(GLOBAL.JSDB, {
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

		tokenize         : tokenize,
		getTokens        : getTokens,
		Walker           : Walker,
		//parse            : parse,
		Table            : Table,
		TableIndex       : TableIndex,
		SERVER           : SERVER,
		Column           : Column,
		TableRow         : TableRow,
		//TableCell : TableCell,
		binarySearch     : binarySearch,
		BinaryTree       : BinaryTree,
		BinaryTreeNode   : BinaryTreeNode,
		crossJoin        : crossJoin,
		innerJoin        : innerJoin,
		crossJoin2       : crossJoin2,
		executeCondition : executeCondition,
		Transaction      : Transaction,

		SQLConstraintError : SQLConstraintError,
		SQLRuntimeError    : SQLRuntimeError,
		SQLParseError      : SQLParseError

	});
}

// -----------------------------------------------------------------------------
// Starts file "src/Result.js"
// -----------------------------------------------------------------------------
/**
 * Creates new Result instance. The idea is to first create an "empty" instance 
 * and then execute a query and update the Result instance using the @setData 
 * method. This way the Result object will also capture the execution time (the
 * time between calling the constructor and calling the setData method).
 * @classdesc Represents the result of any query (from SELECT, UPDATE, DELETE 
 * etc.). The results from SELECT queries have <b>rows</b> and <b>cols</b> 
 * properties...
 * @constructor
 * @author Vladimir Ignatov <vlad.ignatov@gmail.com>
 * @example new Result()
 * @return Result
 */
function Result(data)
{
	/**
	 * The data that the result represents. Initially this is null.
	 * @type {Object|Array|String|Boolean}
	 * @default null
	 * @private
	 */
	this.data = null;

	/**
	 * The type of the result. One of the Result.TYPE_XX constants.
	 * @default Result.TYPE_UNKNOWN
	 * @type {Number}
	 */
	this.type = Result.TYPE_UNKNOWN;

	/**
	 * An array of the names of the columns included in the result set
	 * @type {Array}
	 * @default []
	 */
	this.cols = [];

	/**
	 * An array of the rows included in the result set. Each row can be an array
	 * or an object
	 * @type {Array}
	 * @default []
	 */
	this.rows = [];

	/**
	 * The time when the instance has been created. This is used to measure the
	 * time interval between creating the instance and the setting of the actual
	 * data in the result.
	 * @type {Number}
	 * @private
	 */
	this._startTime = Date.now();

	/**
	 * The time when the data has been set into the instance
	 * @type {Number}
	 * @private
	 * @default 0
	 */
	this._endTime = 0;

	/**
	 * The time interval (in ms) between creating the instance and the setting 
	 * of the actual data in the result.
	 * @type {Number}
	 * @readonly
	 * @default 0
	 */
	this.time = 0;

	/**
	 * The length of the columns in the result. This property set by the 
	 * setData method once, so that the other methods does not need to count 
	 * the columns multiple times.
	 * @type {Number}
	 * @readonly
	 * @default 0
	 */
	this.colLength = 0;
	
	/**
	 * The length of the rows in the result. This property set by the 
	 * setData method once, so that the other methods does not need to count 
	 * the columns multiple times.
	 * @type {Number}
	 * @readonly
	 * @default 0
	 */
	this.rowLength = 0;

	if (arguments.length) {
		this.setData(data);
	}
}

/**
 * Indicates that the result is of unknown type. That is the initial state of 
 * the result and later (when the setData is called) it should with to some of
 * the other type constants.
 * @type {Number}
 * @constant
 * @static
 */
Result.TYPE_UNKNOWN = 0;

/**
 * Indicates that the result is of array type. The result.rows property should
 * be filled with rows but the cols should be empty (unknown)
 * @type {Number}
 * @constant
 * @static
 */
Result.TYPE_ARRAY = 2;

/**
 * Indicates that the result is of set type. The result.rows property should
 * be filled with rows and the cols should be filled too
 * @type {Number}
 * @constant
 * @static
 */
Result.TYPE_SET = 4;

/**
 * Indicates that the result is of string type. The result.data property should
 * be set to a string message.
 * @type {Number}
 * @constant
 * @static
 */
Result.TYPE_MESSAGE = 8;

/**
 * Indicates that the result is of boolean type. The result.data property should
 * be true or false and show if the query was successful or not.
 * @type {Number}
 * @constant
 * @static
 */
Result.TYPE_BOOL = 16;

/**
 * Indicates a result of mutation. The result.data property should be the number
 * of affected rows.
 * @type {Number}
 * @constant
 * @static
 */
Result.TYPE_MUTATION = 32;

Result.prototype = {

	/**
	 * Sets the actual data that this result object represents. 
	 * @param {Object|Array|String|Boolean} data The data might 
	 * be in different formats (see the examples below).
	 * <ul>
	 *   <li>An object with @rows and @cols properties</li>
	 *   <li>An Array</li>
	 *   <li>A string</li>
	 *   <li>A boolean value</li>
	 * </ul>
	 * @example (new Result()).setData([
	 *	 [1, 2], 
	 *	 [3, 4], 
	 *	 [5, 6]
	 * ]);
	 * @example (new Result()).setData({
	 *    cols: ["a", "b"],
	 *    rows: [
	 *       [1, 2],
	 *       [3, 4]
	 *    ]
	 * });
	 * @example (new Result()).setData({
	 *    cols: ["a", "b"],
	 *    rows: [
	 *        { a: 1, b : 2 },
	 *        { b: 3, a : 4 }
	 *    ]
	 * });
	 * @example (new Result()).setData("Query executed successfully");
	 * @return {Result} Returns the instance
	 * @throws {TypeError} Exception - If the argument is invalid
	 */
	setData : function(data)
	{
		this._endTime   = Date.now();
		this.time       = this._endTime - this._startTime;
		this._startTime = this._endTime;
		
		// Object
		if ( data && typeof data == "object" )
		{
			this.data = data;
			this.cols = data.cols || [];
			this.rows = data.rows || [];
			this.type = Result.TYPE_SET;
		}

		// Array
		else if ( Object.prototype.toString.call(data) == "[object Array]" )
		{
			this.data = data;
			this.rows = data;
			this.cols = [];
			this.type = Result.TYPE_ARRAY;
		}

		// Boolean
		else if ( data === true || data === false )
		{
			this.data = data;
			this.cols = [];
			this.rows = [];
			this.type = Result.TYPE_BOOL;
		}

		// Invalid argument
		else
		{
			this.data = String(data || "");
			this.cols = [];
			this.rows = [];
			this.type = Result.TYPE_MESSAGE;
		}

		this.colLength = this.cols.length;
		this.rowLength = this.rows.length;

		return this;
	},

	/**
	 * Tests if the result can be considered successful or not.
	 * @return {Boolean}
	 */
	isSuccess : function()
	{
		if ( this.type === Result.TYPE_UNKNOWN )
			return false;
		if ( this.type === Result.TYPE_BOOL && !this.data )
			return false;
		return true;
	},

	/**
	 * Generates and returns a message describing the result.
	 * @return {String}
	 */
	getMessage : function()
	{
		if ( !this.isSuccess() )
			return "Query failed";
		if ( this.type === Result.TYPE_MESSAGE )
			return this.data;
		if ( this.type === Result.TYPE_ARRAY || this.type === Result.TYPE_SET )
			return this.rowLength + " rows in set. Query took " + 
				this.time + "ms.";
		if ( this.type === Result.TYPE_MUTATION )
			return this.data + " rows affected. Query took " + 
				this.time + "ms.";
		return "Query executed successfully in " + this.time + "ms.";
	},

	/**
	 * Generates and returns an HTML table from the result data.
	 * @param {Object} attrs Optional table attributes as plain object
	 * @return {String} HTML table code
	 * @example resultInstance.toHTML({ "class" : "my-cool-table" });
	 */
	toHTML : function( attrs ) 
	{
		var html   = [],
			colLen = this.cols.length,
			rowLen = this.rows.length,
			tmp, i, j, v;

		html.push('<table');

		if ( attrs ) 
		{
			html.push(' ');

			tmp = [];
			for ( v in attrs )
			{
				tmp.push(v + "=" + escape(attrs[v]));
			}

			html.push(tmp.join(" "));
		}

		html.push('><thead><tr>');

		for ( i = 0; i < colLen; i++ )
        {
			html.push('<th>', this.cols[i], '</th>');
		}

		html.push('</tr></thead><tbody>');

		for ( i = 0; i < rowLen; i++ )
		{
			tmp = this.rows[i];
			html.push('<tr>');
			for ( j = 0; j < colLen; j++ ) 
			{
				v = tmp[this.cols[j]] || tmp[j];
				html.push(
					'<td>', 
					v === undefined ? '' : String(v), 
					'</td>'
				);
			}
			html.push('</tr>');
		}

		html.push('</tbody></table>');
		
		return html.join("");
	},

	/**
	 * Creates and returns a JSON object representing the result
	 * @return {Onject}
	 */
	toJSON : function() 
	{
		var json = {
			message    : this.getMessage(),
			queryTime  : this.time,
			successful : this.isSuccess()
		};

		if ( json.successful ) 
		{
			if ( this.type === Result.TYPE_MUTATION )
			{
				json.affectedRows = this.data;
			}

			if ( this.type === Result.TYPE_ARRAY )
			{
				json.rows = this.rows;
				json.rowLength = this.rowLength;
			}

			if ( this.type === Result.TYPE_SET )
			{
				json.rows = this.rows;
				json.cols = this.cols;
				json.rowLength = this.rowLength;
				json.colLength = this.colLength;
			}
		}

		return json;
	},

	/**
	 * Creates and returns a JSON string representing the result
	 * @param {Number} indent Optional. If provided this must be a positive 
	 * integer to set the number of spaces used for indentation. Setting this to
	 * anything greather than 0 will produce a pretty-printed version of the 
	 * JSON string.
	 * @return {String} JSON code
	 * @example resultInstance.toJSONString(4);
	 */
	toJSONString : function(indent) 
	{
		return JSON.stringify(this.toJSON(), null, indent || 0);
	},

	/**
	 * Creates and returns a string representation of the result
	 * @return {String}
	 * @param {String} rowSeparator - The string used to separate the rows. 
	 * Defaults to ";".
	 * @param {String} valueSeparator - The string used to separate the values 
	 * in the rows. Defaults to ",".
	 */
	toString : function(rowSeparator, valueSeparator) 
	{
		var inst = this,
			rows = [];

		this.forEach(function(row) {
			var curRow = [], i, v;
			for ( i = 0; i < inst.colLength; i++ )
			{
				v = row[inst.cols[i]] || row[i];
				curRow.push(v === undefined ? ';' : String(v));
			}
			rows.push(curRow.join(
				valueSeparator === undefined ? "," : String(valueSeparator)
			));
		});
		
		return rows.join(
			rowSeparator === undefined ? "\n" : String(rowSeparator)
		);
	},

	/**
	 * Creates and returns an XML representation of the result
	 * @param {String} indent The white space used for indentation. Can be one 
	 * or more spaces or tabs. Defaults to "" (no indentation).
	 * @return {String}
	 */
	toXML : function(indent) 
	{
		var inst       = this,
			xml        = [ '<result>' ],
			successful = this.isSuccess();

		xml.push(
			indent ? "\n" : "", 
			indent || "", 
			'<successful>', successful, '</successful>'
		);

		xml.push(
			indent ? "\n" : "", 
			indent || "", 
			'<message>', this.getMessage(), '</message>'
		);

		xml.push(
			indent ? "\n" : "", 
			indent || "", 
			'<queryTime>', this.time, '</queryTime>'
		);

		if ( successful )
		{
			if ( this.type === Result.TYPE_MUTATION )
			{
				xml.push(
					indent ? "\n" : "", 
					indent || "", 
					'<affectedRows>', this.data, '</affectedRows>'
				);
			}

			if ( this.type === Result.TYPE_ARRAY )
			{
				xml.push(
					indent ? "\n" : "", 
					indent || "", 
					'<rowLength>', this.rowLength, '</rowLength>'
				);
			}

			if ( this.type === Result.TYPE_SET )
			{
				xml.push(
					indent ? "\n" : "", 
					indent || "", 
					'<rowLength>', this.rowLength, '</rowLength>'
				);
				xml.push(
					indent ? "\n" : "", 
					indent || "", 
					'<colLength>', this.colLength, '</colLength>'
				);
			}

			if ( this.type === Result.TYPE_ARRAY || this.type === Result.TYPE_SET )
			{
				this.forEach(function(row) {
					var curRow = [], i, v;

					curRow.push(indent ? "\n" : "", indent || "", '<row>');
					for ( i = 0; i < inst.colLength; i++ )
					{
						v = row[inst.cols[i]] || row[i];
						curRow.push(
							indent ? "\n" : "",
							indent || "", 
							indent || "", 
							'<property>', 
							v === undefined ? '' : String(v),
							'</property>'
						);
					}
					curRow.push(indent ? "\n" : "", indent || "", '</row>');
					xml.push(curRow.join(""));
				});
			}
		}

		xml.push(indent ? "\n" : "", '</result>');
		return xml.join("");
	},

	/**
	 * Creates and returns a CSV representation of the result
	 * @return {String}
	 */
	toCSV : function() 
	{
		return this.toString("\n", ",");
	},

	/**
	 * Iterates over the result rows and calls the callback function for each
	 * row.
	 * @param {Function} callback The callback function to be invoked on each
	 * row. It will be called with 3 arguments:
	 * <ol>
	 *     <li>The current row</li>
	 *     <li>The current row index</li>
	 *     <li>All the rows</li>
	 * </ol>
	 * If the function returns <b>false</b> (exactly) the iteration will be 
	 * stopped.
	 * @example resultInstance.forEach(function(row, rowIndex, allRows) {
	 *     // Do something with the row
	 * });
	 * @return {void}
	 */
	forEach : function( callback ) 
	{
		for ( var i = 0; i < this.rowLength; i++ )
		{
			if ( callback( this.rows[i], i, this.rows ) === false )
			{
				break;
			}
		}
	}
};




// -----------------------------------------------------------------------------
// Starts file "src/facade.js"
// -----------------------------------------------------------------------------
var API = {
	query  : query2,
	config : config,
	on     : events.on.bind(events),
	one    : events.one.bind(events),
	off    : events.off.bind(events),
	each   : forEachRow
};

function jsSQL(opts, cb) {

	if (!cb) {
		cb = opts;
		opts = {};
	}

	mixin(CFG, opts);
	
	if (!isFunction(cb))
		return;

	if (!JSDB.SERVER.loaded) {
		JSDB.events.one("load:server", function() {
			cb(API);	
		});
	} else {
		cb(API);
	}
}

function config(options) {
	if (options === undefined)
		return mixin({}, CFG);
	mixin(CFG, options);
}

function forEachRow(sql, cb) {
	query2(sql, function(err, result) {
		if (err) throw err;

		if (result && result.rows) {
			result.rows.forEach(cb);
		}
	});
}

jsSQL.on  = API.on;
jsSQL.one = API.one;
jsSQL.off = API.off;

window.jsSQL = jsSQL;

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

jsSQL.version = '0.0.26';
})(window);
