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
	return s.replace(/(%s)/g, function(a, match) {
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
					a[key] = mixin(isArray(tmp) ? [] : {}, tmp);
				} else {
					a[key] = tmp;
				}
			}
		} 
		else 
		{
			for ( key in b ) 
			{
				if ( b.hasOwnProperty(key) ) 
				{
					tmp = b[key];
					if ( tmp && typeof tmp == "object" ) {
						a[key] = mixin(isArray(tmp) ? [] : {}, tmp);
					} else {
						a[key] = tmp;
					}
				}
			}
		}
	}

	return a;
}

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

	console.log(body, args, values, context);
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
