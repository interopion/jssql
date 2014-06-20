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