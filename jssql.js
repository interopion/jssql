/**
 * jsSQL version 0.1.182
 */
(function(GLOBAL, undefined) {
"use strict";

// -----------------------------------------------------------------------------
// Starts file "src/constants.js"
// -----------------------------------------------------------------------------
var 

//SERVER,

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

//CFG = {
//	debug         : false,
//	storageEngine : "LocalStorage",
//	socketIoPath  : "http://Vladimirs-MacBook-Pro.local:3001"
//},

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
//STATE_IDDLE    = 0,
//STATE_WAITING  = 2,
//STATE_WORKING  = 4,
//STATE_ERROR    = 8,
//STATE_COMPLETE = 16,

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

//DATABASES = {},
//CURRENT_DATABASE,

// Regular Expressions
RE_VARIABLE = /^[a-zA-Z\$_][a-zA-Z0-9\$_]*$/,
RE_SURROUNDING_SPACE = /^\s+|\s+$/,
RE_ISO8601 = new RegExp([
	"^",
	"(",                                 // \1  - date
		"\\s*",
		"(\\d{4})",                      // \2  - year
		"-",
		"(0[1-9]|1[0-2]|[1-9])",         // \3  - month
		"-",
		"([12]\\d|0[1-9]|3[01]|[1-9])",  // \4  - day
	")?",
	"(",                                 // \5  - time
		"[tT\\s]?",                           
		"([01]\\d|2[0-3])",              // \6  - hours
		"\\:",
		"([0-5]\\d|\\d)",                // \7  - minutes
		"(\\:",                          // \8  - seconds and milliseconds
			"([0-5]\\d|\\d)",            // \9  - seconds
			"([\\.,](\\d+))?",           // \11 - milliseconds
		")?",
		"\\s*(",                         // \12 - timezone
			"[zZ]|",
			"(",
				"([\\+\\-])",            // \14 - timezone direction
				"([01]\\d|2[0-3]|\\d)",  // \15 - timezone hours
				"(\\:?([0-5]\\d|\\d))?", // \17 - timezone minutes
			")",
		")?", 
	")?",
	"\\s*$"
].join("")),

DATEFORMAT_ISO8601    = "%Y-%m-%dT%H:%M:%S%z",
DATEFORMAT_ISO8601_MS = "%Y-%m-%dT%H:%M:%f%z",

MILLISECOND = 1,
SECOND      = MILLISECOND * 1000, // 1000
MINUTE      = SECOND * 60,        // 60000
HOUR        = MINUTE * 60,        // 3600000
DAY         = HOUR * 24,          // 86400000
WEEK        = DAY * 7,            // 604800000
YEAR        = DAY * 365,          // 31536000000
LEAP_YEAR   = YEAR + DAY,         // 31622400000


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
var objectToString = Object.prototype.toString;

function is(x, type) {
  return objectToString.call(x) == "[object " + type + "]";
}

/**
 * Returns the float representation of the first argument or the
 * "defaultValue" if the float conversion is not possible.
 * @memberof Utils
 * @param {*} x The argument to convert
 * @param {*} defaultValue The fall-back return value. This is going to be
 *                         converted to float too.
 * @return {Number} The resulting floating point number.
 */
//function floatVal(x, defaultValue) 
//{
//    var out = parseFloat(x);
//    if (isNaN(out) || !isFinite(out)) {
//        out = defaultValue === undefined ? 0 : floatVal(defaultValue);
//    }
//    return out;
//}

/**
 * Returns the int representation of the first argument or the
 * "defaultValue" if the int conversion is not possible.
 * @memberof Utils
 * @param {*} x The argument to convert
 * @param {*} defaultValue The fall-back return value. This is going to be
 *                         converted to integer too.
 * @return {Number} The resulting integer.
 */
function intVal(x, defaultValue) {
    var out = parseInt(x, 10);
    if (isNaN(out) || !isFinite(out))
        out = defaultValue === undefined ? 0 : intVal(defaultValue);
    return out;
}

/**
 * Rounds the given number to configurable precision.
 * @memberof Utils
 * @param {numeric} n The argument to round.
 * @param {Number} p The precision (number of digits after the
 *                   decimal point) to use. "p" can be negative to cause p 
 *                   digits left of the decimal point of the value X to become 
 *                   zero.
 * @return {Number} The resulting number.
 */
function roundToPrecision(n, p) {
    n = parseFloat(n);

    if (isNaN(n) || !isFinite(n))
        return n;

    if (!p || isNaN(p) || !isFinite(p))
        return Math.round(n);

    if (p < 0)
      return truncate(n, p);

    var q = Math.pow(10, p);
    return Math.round(n * q) / q;
}

/**
 * Returns the number X, truncated to D decimal places. If D is 0, the result 
 * has no decimal point or fractional part. D can be negative to cause D digits 
 * left of the decimal point of the value X to become zero.
 * @param {Number} X
 * @param {Number} D
 * @return {Number}
 */
function truncate(X, D) {
  D = D || 0;

  if (D === 0)
    return X < 0 ? Math.ceil(X) : Math.floor(X);

  if (D < 0) {
    D = Math.pow(10, D * -1);
    return Math.floor(X/D) * D;
  }

  var toks = String(X).split("."),
    outI = toks[0],
    outF = toks[1] || "0";

  D = Math.pow(10, Math.max(0, outF.length - D));
  return parseFloat(outI + "."  + Math.floor(outF / D) * D);
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
function strf(s) {
  var args = arguments, l = args.length, i = 0;
  return String(s || "").replace(/(%s)/g, function(a) {
    return ++i > l ? "" : args[i];
  });
}

/**
 * Generates and returns a human-readable representation of arrays. This is used 
 * to generate the "expecting one of" strings... 
 * @memberof Utils
 * @param {Array} The array to join
 * @return {String} 
 */
function prettyList(arr) {
  var len = arr.length, last;
  if (len === 0)
    return '';

  if (len === 1)
    return quote(arr[0]);

  if (len == 2)
    return quote(arr[0]) + " or " + quote(arr[1]);
  
  var out = [], i;
  for(i = 0; i < arr.length; i++)
    out.push(quote(arr[i]));

  last = out.pop();

  return "one of " + out.join(", ") + " or " + last;
}

/**
 * Quotes a string using the specified quotation mark (should be one of '|"|`).
 * @memberof Utils
 * @param {String} 
 */
function quote(str, q) {
  q = q || '"';
  return q + String(str).replace(q, q + "" + q) + q;
}

function makeArray(x) {
  if ( isArray(x) )
    return x;

  if ( x && typeof x.toArray == "function" )
    return makeArray(x.toArray());

  if ( x && typeof x == "object" && "length" in x )
    return Array.prototype.slice.call(x);

  return [x];
}

function error(options) {
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

function trim(str) {
  return String(str).replace(RE_SURROUNDING_SPACE, "");
}

function getTokens(sql, options)
{
  var tokens = [],
    level  = 0,
    i      = 0;

  options = options || {};

  function openBlock() { 
    level++; 
    if (options.onBlockOpen) 
      options.onBlockOpen(level);
  }

  function closeBlock() { 
    level--; 
    if (options.onBlockClose) 
      options.onBlockClose(level);
  }

  function handleToken(tok) {
    tokens[i++] = tok;
  }

  tokenize(sql, handleToken, openBlock, closeBlock, options);

  if (level > 0)
    throw new SyntaxError("Unclosed block");

  if (level < 0)
    throw new SyntaxError("Extra closing block");

  return tokens;
}

function each(o, callback, scope) {
  var key, len, argLen = arguments.length;
  
  if (argLen < 2 || !o || typeof o != "object")
    throw "Invalid arguments";
  
  if (is(o, "Array")) {
    //if ( typeof o.every == "function" ) {
    //  return o.every(callback, scope);
    //}
    len = o.length;
    for ( key = 0; key < len; key++ ) {
      if ( argLen > 2 ) {
        if ( callback.call(scope, o[key], key, o) === false )
          break;
      } else {
        if ( callback(o[key], key, o) === false )
          break;
      }
    }
  } else {
    for ( key in o )
      if ( argLen > 2 ) {
        if ( callback.call(scope, o[key], key, o) === false )
          break;
      } else {
        if ( callback(o[key], key, o) === false )
          break;
      }
  }
}

function every(o, callback, scope)
{
  var key, len, argLen = arguments.length;
  
  if (argLen < 2 || !o || typeof o != "object")
    return false;
  
  if (is(o, "Array")) {
    if ( typeof o.every == "function" )
      return o.every(callback, scope);

    len = o.length;
    for ( key = 0; key < len; key++ ) {
      if ( argLen > 2 ) {
        if ( callback.call(scope, o[key], key, o) === false )
          return false;
      } else {
        if ( callback(o[key], key, o) === false )
          return false;
      }
    }
  } else {
    for ( key in o ) {
      if ( argLen > 2 ) {
        if ( callback.call(scope, o[key], key, o) === false )
          return false;
      } else {
        if ( callback(o[key], key, o) === false )
          return false;
      }
    }
  }
  return true;
}

/*function some(o, callback, scope)
{
  var key, len, argLen = arguments.length;
  
  if (argLen < 2 || !o || typeof o != "object") {
    return false;
  }
  
  if (is(o, "Array")) {
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
}*/

function keys(o, all) {
  var out = [], x;
  for (x in o) {
    if (all || o.hasOwnProperty(x))
      out.push(x);
  }
  return out;
}

function noop() {}

/*function getDatabase(dbName, throwError)
{
  var database;
  if (!dbName) {
    database = SERVER.currentDatabase;
    if (!database) {
      if (throwError === false)
        return null;

      throw new SQLRuntimeError( 'No database selected.' );
    }
  } else {
    database = SERVER.databases[dbName];
    if (!database) {
      if (throwError === false)
        return null;
      
      throw new SQLRuntimeError( 'No such database "%s"', dbName );
    }
  }
  
  return database;
}

function getTable(tableName, dbName, throwError)
{     
  var database = getDatabase(dbName, throwError), table;

  if (!database) return null;
  
  table = database.tables[tableName];

  if (!table) {
    if (throwError === false) 
      return null;
    
    throw new SQLRuntimeError(
      'No such table "%s" in database "%s"',
      tableName,
      database.name
    );
  }
  
  return table;
}

function createTable(name, fields, ifNotExists, database, next)
{
  database = database || SERVER.currentDatabase;
  
  if (!database) {
    throw new SQLRuntimeError("No database selected");
  }
  
  return database.createTable(name, fields, ifNotExists, next);
}*/

function isArray(x) {
  return is(x, "Array");
}

function isFunction(x) {
  return is(x, "Function");
}

function isNumeric(x) {
  return trim(x * 1) === trim(x);
}

function binarySearch(haystack, needle, comparator, low, high) {
  var mid, cmp;

  if (low === undefined)
      low = 0;
  else {
      low = low|0;
      if (low < 0 || low >= haystack.length)
      throw new RangeError("invalid lower bound");
  }

  if (high === undefined)
      high = haystack.length - 1;
  else {
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

function assertType(obj, type, msg) {
  if ( !is(obj, type) )
    throw new TypeError(msg || "Invalid type ('" + type + "' is required)");
}

function assertInstance(obj, constructor, msg) {
  if (!(obj instanceof constructor))
    throw new TypeError(msg || "Invalid object type");
}

function assertInBounds(val, arr, msg) {
  if (val < 0 || val >= arr.length)
    throw new RangeError(msg || "value out of bounds");
}

function assertInObject(key, obj, msg) {
  if ( !(key in obj) )
    throw new Error(msg || "No such property '" + key + "'.");
}

function assert(condition, msg) {
  if (!(condition))
    throw new Error(msg || "Assertion failed");
}

/*function defaultErrorHandler(e) 
{
  if (CFG.debug && window.console && console.error) 
    console.error(e);
}*/

function createNextHandler(fn) {
  return isFunction(fn) ? fn : function(err) {
    if (err)
      throw err;
  };
}

function mixin() {
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
        if ( tmp && typeof tmp == "object" )
          a[key] = mixin(isArray(tmp) ? [] : {}, a[key], tmp);
        else
          a[key] = tmp;
      }
    } 
    else if (b && typeof b == "object")
    {
      for ( key in b ) 
      {
        if ( b.hasOwnProperty(key) ) 
        {
          tmp = b[key];
          if ( tmp && typeof tmp == "object" )
            a[key] = mixin(isArray(tmp) ? [] : {}, a[key], tmp);
          else
            a[key] = tmp;
        }
      }
    }
  }

  return a;
}

function prependZero(n, len) {
  var q = len || 1, x = String(n).length;
  while (x++ < q) n = "0" + n;
  return n;
}


// =============================================================================
//                             Date/Time Utils
// =============================================================================

/* 
 * This returns true if year is a leap year.  Must use 4 digit year.
 */
function isLeapYear(year) {
  return year % 4 === 0 && 
    (year % 100 !== 0 || year % 400 === 0);
}

function getWeek(date) {
    var firstMon = new Date(date.getFullYear(), 0, 1);
    return Math.floor((date.getTime() + DAY - firstMon) / WEEK);
}

function dateToISO8601(format) {
  /* jshint ignore:start */
  return strftime(format || "%Y-%m-%dT%H:%M:%f%z", this);
  /* jshint ignore:end */
}

function parseISO8601(input) {
  var date = new Date(0,0,1,0,0,0,0), m = String(input).match(RE_ISO8601), tz;

  if (m) {
    date.setFullYear    (parseInt(m[2 ] || 0, 10));
    date.setMonth       (parseInt((m[3 ] || 1) - 1, 10));
    date.setDate        (parseInt(m[4 ] || 1, 10));
    date.setHours       (parseInt(m[6 ] || 0, 10));
    date.setMinutes     (parseInt(m[7 ] || 0, 10));
    date.setSeconds     (parseInt(m[9 ] || 0, 10));
    date.setMilliseconds(parseInt(m[11] || 0, 10));

    tz = String(m[12]).toUpperCase();

    if (tz == "Z")
      date._offset = 0;
    else if (m[14]) {

      // custom hours offset
      if (m[15])
        date._offset = parseInt(m[14] + m[15], 10) * HOUR;

      // custom minutes offset
      if (m[17])
        date._offset += parseInt(m[14] + m[17].replace(/^0/, ""), 10) * MINUTE;
    }
  } else
    date.setFullYear(0);

  date.toString = dateToISO8601;

  return date;
}

// ISO-8601
// now (case insensitive) 
// unix time integer
// a Date object
function parseDate(input, mods) {

  var type = Object.prototype.toString.call(input), date;

  // By Date object
  if (type == "[object Date]")
    date = input;

  // By unix time number
  else if (type == "[object Number]")
    date = new Date(input);

  // Require string argument from now on
  else if (type != "[object String]")
    date = parseISO8601(0);

  // By "now" string
  else if (input.toLowerCase() == "now")
    date = new Date(Date.now());

  // By unix time as string
  else if (isNumeric(input))
    date = new Date(input * 1);

  else
    date = parseISO8601(input);

  if (!isNaN(date * 1)) {
    mods = isArray(mods) ? mods : makeArray(arguments).slice(1);
    mods.forEach(function(mod) {
      dateModify(date, mod);  
    });
  }

  date.toString = dateToISO8601;

  return date;
}

function dateModify(date, mod) {
  var m = mod.match(/^\s*([+-]?\d+(\.\d+)?\s+)?(.*)?\s*$/), tmp;

  if (m) {

    // simply add the specified amount of time to the date and time 
    // specified by the modifiers
    if (m[1]) {
      var q = parseFloat(m[1]), add;
      switch (m[3].toLowerCase()) {
        case "days":
          tmp = date.getDate();
          date.setDate(tmp + q);
          break;
        case "hours":
          tmp = date.getHours();
          date.setHours(tmp + q);
          break;
        case "minutes":
          tmp = date.getMinutes();
          date.setMinutes(tmp + q);
          break;
        case "seconds":
          tmp = date.getSeconds();
          date.setSeconds(tmp + q);
          break;
        case "months":
          tmp = date.getMonth();
          date.setMonth(tmp + q);
          break;
        case "years":
          tmp = date.getFullYear();
          date.setFullYear(tmp + q);
          break;
        default:
          return;
      }
    } else {

      switch (m[3].toLowerCase()) {
        
        // shift backwards to the beginning of the current month
        case "start of month":
          date.setDate(1);
          date.setHours(0, 0, 0, 0);
          break;

        // shift backwards to the beginning of the current year
        case "start of year":
          date.setMonth(0, 1);
          date.setHours(0, 0, 0, 0);
          break;

        // shift backwards to the beginning of the current day
        case "start of day":
          date.setHours(0, 0, 0, 0);
          break;

        // Adjusts the time so that it displays localtime.
        case "localtime":
          if (date._offset)
            date.setTime(date.getTime() - date._offset);
          date._offset = date.getTimezoneOffset() * MINUTE;
          date.setTime(date.getTime() + date._offset);
          break;

        // Adjusts the time to be in UTC
        case "utc":
          if (date._offset) {
            date.setTime(date.getTime() - date._offset);
            date._offset = 0;
          }
          break;

        default:

          // weekday N
          // 
          // The "weekday" modifier advances the date forward to the 
          // next date where the weekday number is N. Sunday is 0, 
          // Monday is 1, and so forth.
          var match = m[3].match(/weekday\s+([0-6])/), d, n;
          if (match) {
            n = date.getDay();
            d = parseInt(match[1]);
            date.setDate(date.getDate() + (d<n ? 7+d-n : d-n));
          }
          break;
      }
    }
  }
}

function strftime(format, date, mods) {
  format = format || DATEFORMAT_ISO8601;
  mods   = Array.prototype.slice.call(arguments, 2);
  date   = parseDate(date || "now", mods);
  
  return format
    .replace(/%%/g, "__DOUBLE_%__")

    // date (01-28/29/30/31)
    .replace(/%d/g, prependZero(date.getDate(), 2))
    
    // float seconds (00-59).(000-999)
    .replace(/%f/g, prependZero(date.getSeconds(), 2) + "." + 
      prependZero(date.getMilliseconds(), 3))
    
    // Hours (00-23)
    .replace(/%H/g, prependZero(date.getHours(), 2))
    
    // Day of year (001-365/366)
    .replace(/%j/g, prependZero(Math.ceil((+date - 
        (new Date(date.getFullYear(), 0, 0, 24, 0, 0, 0))*1
      )/DAY), 3))

    // Month (01-12)
    .replace(/%m/g, prependZero(date.getMonth() + 1, 2))

    // Minutes (00-59)
    .replace(/%M/g, prependZero(date.getMinutes(), 2))

    // Unix time
    .replace(/%s/g, +date)

    // Seconds (00-59)
    .replace(/%S/g, prependZero(date.getSeconds(), 2))

    // Day of week (0-6)
    .replace(/%w/g, date.getDay())

    // Week (00-53) 
    // The first Monday of January is the first day of week 1; days in the 
    // new year before this are in week 0
    .replace(/%W/g, prependZero(getWeek(date), 2))
    
    // Year (4 digits)
    .replace(/%Y/g, prependZero(date.getFullYear(), 4))

    // Timezone
    // Replaced by the offset from UTC in the ISO 8601:2000 standard format 
    // (+hhmm or -hhmm), or by no characters if no timezone is determinable
    .replace(
      /%z/g, 
      date._offset === 0 ?
        "Z" :
        !date._offset ? 
          "" : 
          (date._offset < 0 ? "-" : "+") + 
          prependZero(Math.floor(Math.abs(date._offset) / HOUR), 2) + 
          prependZero(
            Math.floor((Math.abs(date._offset) % HOUR) / MINUTE), 2)
    )

    .replace(/__DOUBLE_%__/g, "%");
}


jsSQL.parseDate  = parseDate;
jsSQL.strftime   = strftime;



var SQL_FUNCTIONS = {
  
  // Date & Time -------------------------------------------------------------
  DATE      : strftime,
  NOW       : function() { return strftime("%s", "now"); },
  //DATEDIFF : function() {},

  //DEFAULT : function() {},
  //UUID     : function() {},
  //SLEEP   : function() {},

  // Math --------------------------------------------------------------------
  //ABS      : Math.abs,
  RAND      : Math.random,
  ROUND     : roundToPrecision,
  TRUNCATE  : truncate,

  
  //IF       : function() {},
  //IFNULL   : function() {},
  //NULLIF   : function() {}

  // Other -------------------------------------------------------------------
  BENCHMARK : function(count, expr) {
    var start = Date.now(), scope = {}, sandbox = { BENCHMARK : null };
    for (var i = 0; i < count; i++) {
      executeCondition(expr, scopebv, sandbox);
    }
    return Date.now() - start;
  }
};

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
    sandbox      = mixin({}, SQL_FUNCTIONS, options.sandbox),
    translations = options.translations || {},
    scope        = options.scope || {},
    body         = options.code || '',
    context      = options.context || options.context === null ? options.context : {},
    key;

  //console.log(body, scope);

  for ( key in sandbox ) {
    args.push( key );
    values.push( sandbox[key] );
  }

  for ( key in scope ) {
    if (RE_VARIABLE.test(key)) {
      args.push( key );
      values.push( scope[key] );
    }
  }

  // Replace what looks like variables to __scope__[variable]
  //for ( key in scope ) {
  //  if (/^[a-zA-Z\$_][a-zA-Z0-9\$_]*$/.test(key)) {
  //    body = body.replace(
  //      new RegExp("\\b" + key + "\\b", "gi"),
  //      "__scope__['" + key + "']"
  //    );
  //  }
  //}

  //args.push( "__scope__" );
  //values.push( scope );

  for ( key in translations )
    body = body.replace(new RegExp(key, "gi"), translations[key]);

  body = body.replace(/^(\s*return\s+)?/, "return ");

  //console.log("body: ", body);
  //console.log("args: ", args); 
  //console.log("context: ", context);
  //console.log("values: ", values);
  //console.log("scope: ", scope); 
  
  return (new Function( args.join(", "), body )).apply( context, values );
}

function executeCondition(condition, scope, sandbox) 
{//console.log(condition, scope);
  return executeInSandbox({
    code    : condition, 
    sandbox : sandbox || {},
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
        ll = left.push(mixin(right[ri]));
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
            mixin(left[li], right[ri]);
          else {
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
  sql = normalizeQueryList(sql);

  var queries = new QueryList(),
    //state   = { level : 0 },
    tokens  = getTokens(sql, {
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

// Class
// =============================================================================
function Class() {}

Class._super_ = Function;

Class.extend = function extend(props, staticProps) {
  var Constructor = function() {
    if (typeof this.construct == "function")  {
      return this.construct.apply(this, arguments);
    }
  };

  Constructor.prototype = new this();
  
  if (staticProps)
    mixin(Constructor, staticProps);
  
  mixin(Constructor.prototype, props);

  Constructor.prototype.constructor = Constructor;
  Constructor._super_ = this;
  Constructor.extend = extend;
  return Constructor;
};

// jsJQL
// =============================================================================
function createPublicAPI(server) {
  return {
    query : function(sql, cb) {
      return server.query(sql, cb);
    },
    getDatabase : function(dbName) {
      return server.getDatabase(dbName, false);
    },
    getCurrentDatabase : function() {
      return server.getCurrentDatabase();
    },
    getTable : function(tableName, dbName) {
      return server.getTable(tableName, dbName, false);
    },
    forEachRow : function(sql, cb) {
      server.query(sql, function(err, result) {
        if (err) throw err;

        if (result && result.rows) {
          result.rows.forEach(cb);
        }
      });
    },
    config : function(name, value) {
      server.config(name, value);
    },
    on : function(e, h) {
      return server.on(e, h);
    },
    one : function(e, h) {
      return server.one(e, h);
    },
    off : function(e, h) {
      server.off(e, h);
      return this;
    },
    destroy : function(cb) {
      server.destroy(cb);
    }
  };
}

function jsSQL(opts, cb) {
  
  if (!cb) {
    cb = opts;
    opts = {};
  }

  // It is useless to create a server (cannot be used ot of the callback)
  if (!isFunction(cb))
    return;

  (new Server(opts)).load(function(err, server) {
    if (err) 
      throw err;
    
    //console.dir(server.serialize(3));
    //console.log(server);
    cb(createPublicAPI(server));
  });
}

var nextTick = (function() {
  function byObserver(Observer) {
    var node = document.createTextNode(""), queue = [], data = 1;

    new Observer(function() {
      while (queue.length) queue.shift()();
    }).observe(node, { characterData: true });
    
    return function(fn) {
      queue.push(fn);
      data = node.data = data * -1;
    };
  }

  if (typeof setImmediate === 'function') {
    //console.log("using setImmediate");
    return function(fn) { setImmediate(fn); };
  }

  if (typeof MutationObserver === 'function') {
    //console.log("using MutationObserver");
    return byObserver(MutationObserver);
  }

  if (typeof WebKitMutationObserver === 'function') {
    //console.log("using WebKitMutationObserver");
    return byObserver(WebKitMutationObserver);
  }

  //console.log("using setTimeout");
  return function(cb) { setTimeout(cb, 0); };

})();

jsSQL.nextTick = nextTick;


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
// Starts file "src/Observer.js"
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
	this.bind = function(eType, handler) 
	{
		if (handler === false)
			handler = returnFalse;

		var c = listeners[eType];
		if (!c)
			c = listeners[eType] = [];
		
		c.push(handler);
		return handler;
	};

	/**
	 * Adds an event listener that removes itself after the first call to it
	 * @param {String} eType The event type to listen for
	 * @param {Function|Boolean} handler The function to be invoked. Can also be 
	 * a falsy value which will be internally converted to a function that 
	 * returns false.
	 * @return {Function} The bound event handler
	 */
	this.one = function(eType, handler) 
	{
		if (handler === false)
			handler = function() {
				return false;
			};

		handler.__one_time_listener__ = true;
		return this.bind(eType, handler);
	};

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
	 * @return {Observer} Returns the instance
	 */
	this.unbind = function(eType, handler) 
	{
		if (!eType) {
			listeners = {};
		} else if (!handler) {
			listeners[eType] = [];
		} else {
			var a = listeners[eType] || [], l = a.length;
			while (l--) {
				if (a[l] === handler) {
					a.splice(l, 1);
				}
			}
		}
		
		return this;
	};

	this.dispatch = function(e) 
	{
		var handlers = listeners[e] || [], 
			canceled = false,
			args     = Array.prototype.slice.call(arguments, 0),
			len      = handlers.length,
			bubbleTarget,
			i, fn, out;

		for (i = 0; i < len; i++) {
			fn  = handlers[i]; 
			out = fn.apply(this, args);

			if (fn.__one_time_listener__) {
				handlers.splice(i--, 1);
				len--;
			}

			if (out === false) {
				canceled = true; 
				break;
			}
		}

		// Event bubbling
		if (!canceled) {
			bubbleTarget = this.bubbleTarget;
			if (bubbleTarget)
				canceled = bubbleTarget.dispatch.apply(bubbleTarget, args) === false;
		}
		
		return !canceled;
	};

	// some aliases
	this.on      = this.bind;
	this.off     = this.unbind;
	this.once    = this.one;
	this.emit    = this.dispatch;
	this.trigger = this.dispatch;
}

//var events = new Observer();

// -----------------------------------------------------------------------------
// Starts file "src/tokenizer.js"
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                              SQL Tokenizer                                 //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
function tokenize(sql, tokenCallback, openBlock, closeBlock, options) {
	var pos   = 0,
		buf   = "",
		state = TOKEN_TYPE_UNKNOWN,
		line  = 1,
		col   = 0,
		start = 0,
		i     = 0,
		level = 0,
		cfg   = options || {},
		token, cur, next, inStream, tmp;

	var SKIP_SPACE     = !!cfg.skipSpace;
	var SKIP_EOL       = !!cfg.skipEol;
	var SKIP_COMMENTS  = !!cfg.skipComments;
	var SKIP_STR_QUOTS = !!cfg.skipStrQuots;

	function _error(msg) {
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

	function commit() {
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
				pos,//,       // end
				//_len  // length
				level
			];

			msg = tokenCallback(token);
		}

		buf   = "";
		state = TOKEN_TYPE_UNKNOWN;
		start = pos;
		
		if (msg && msg !== true)
			_error(msg);
		else if (msg === false)
			pos = -1;
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
					buf += cur;
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
							if (buf) commit(); // close
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
			case "\r":
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
						
						while (sql[pos] && sql[pos] != "'" && sql[pos+1] != "'") {
							buf += sql[pos++];
						}
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

						while (sql[pos] && sql[pos] != '"' && sql[pos+1] != '"') {
							buf += sql[pos++];
						}
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

						while (sql[pos] && sql[pos] != '`' && sql[pos+1] != '`') {
							buf += sql[pos++];
						}
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
					level++;
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
					level--;
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
				if (inStream)
					buf += cur;
				else {
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
				if (inStream)
					buf += cur;
				else {
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
				if (state === TOKEN_TYPE_SPACE)
					if (buf) commit();
				buf += cur;
				pos++;
			break;
		}
		//pos++;
		col++;
	}

	if (buf)
		commit();

	if (state === TOKEN_TYPE_SINGLE_QUOTE_STRING)
		throw 'Unexpected end of input. Expecting \'.';
	else if (state === TOKEN_TYPE_DOUBLE_QUOTE_STRING)
		throw 'Unexpected end of input. Expecting ".';
	else if (state === TOKEN_TYPE_BACK_TICK_STRING)
		throw 'Unexpected end of input. Expecting `.';
	else if (state === TOKEN_TYPE_MULTI_COMMENT)
		throw 'Unexpected end of input. Expecting */.';

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
function Walker(tokens, input, server)
{
	/**
	 * The tokens array
	 * @type {Array}
	 * @private
	 */
	this._tokens = [];

	this.init(tokens, input, server);
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
	init : function(tokens, input, server)
	{
		this._pos = 0;
		this._tokens = tokens || [];
		this._input = input || "";
		this.server = server;
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

	is : function(arg, caseSensitive, move)
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
					if (move) this._pos++;
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
			if (move) this._pos++;
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
			if (!move) this._pos = start;
			return true;
		}

		// Negation ------------------------------------------------------------
		if (arg[0] == "!") {
			if (!this.is(arg.substr(1), caseSensitive)) {
				if (move) this._pos++;
				return true;
			}
			return false;
		}

		// Token type matching -------------------------------------------------
		if (arg[0] == "@") {
			var type = intVal(arg.substr(1));
			if (token && token[1] === type) {
				if (move) this._pos++;
				return true;
			}
			return false;
		}
		
		// Case sensitive string match -----------------------------------------
		if (caseSensitive) {
			if (arg === str) {
				if (move) this._pos++;
				return true;
			}
			return false;
		}

		// Case insensitive string match ---------------------------------------
		if (arg.toUpperCase() === str.toUpperCase()) {
			if (move) this._pos++;
			return true;
		}
		return false;
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

	some : function(options, caseSensitive, params) 
	{
		var token = this._tokens[this._pos], 
			key, 
			keys = [], 
			walker = this,
			args = makeArray(params),
			subkeys, y, prev, match;

		function onMatch() {
			match = true;
		}
		
		if (token) {
			for ( key in options ) {
				if (this.is(key, caseSensitive, true)) {
					//this._pos++;
					options[key].apply(this, args);
					return this;
				}
				/*
				if (key.indexOf("|") > 0) {
					subkeys = key.split(/\s*\|\s*//*);
					for ( y = 0; y < subkeys.length; y++ ) {
						if ((caseSensitive && subkeys[y] === token[0] ) || 
							(!caseSensitive && subkeys[y].toUpperCase() === token[0].toUpperCase())) 
						{
							this._pos++;
							options[key].apply(this, args);
							return this;
						}
					}
				}
				else if (key.indexOf(" ") > 0) {
					match = false;
					
					this.optional(key, onMatch);

					if (match) {
						options[key].apply(this, args);
						return this;
					}
				}
				else if ( 
					(caseSensitive && key === token[0] ) || 
					(!caseSensitive && key.toUpperCase() === token[0].toUpperCase())
				) {
					this._pos++;
					options[key].apply(this, args);
					return this;
				}*/

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
	
	pick : function(options, caseSensitive, params) 
	{
		return this.some(options, caseSensitive, params); 
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
	nextUntil : function(value, callback, sameLevel) 
	{ 
		var cur   = this.current(),
			level = cur ? cur[4] : -1;
		/*
		var cur   = this.current(),
			level = cur ? cur[4] : -1;
			//debugger;
		while (cur) {
			
			//if ( !sameLevel || (sameLevel && cur[4] !== level) ) {
				if ( this.is(value) ) {
					if ( callback )
						callback.call( this, cur );

					break;
				}	
			//}

			cur = this.next();

		}
		
		return this; 
		*/
		while ( !this.is(value) || (sameLevel && this.current()[4] !== level) ) 
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
		//beforeUndo   : noop, // args: task, pos
		//afterUndo    : noop, // args: task, pos
		//onProgress   : noop, // args: q, task, pos
		timeout      : 1000, // For any single task
		delay        : 0,
		name         : "Anonymous transaction",
		autoRollback : true,
		debug        : false
	}, options),

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
	timer = 0,
	
	/**
	 * The delay timeout
	 * @private
	 */
	delay = 0,

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
	lastError = "";

	Observer.call(this);

	if (config.debug) {
		this.on("error", function(e, err) {
			console.error(err);
		});
		this.on("before:task", function(e, task, pos) {
			console.info("Starting task ", config.name, "->", task.name);
		});
		//this.on("after:task", function(e, task, pos) {
		//	console.info(e, "(" + pos + ")", config.name, "->", task.name);
		//});
		this.one("complete", function(e) {
			console.info('Transaction complete "%s"', config.name);
		});
	}

	var eventMap = {
		"onComplete" : "complete",
		"onRollback" : "rollback",
		"onError"    : "error",
		"beforeTask" : "before:task",
		"afterTask"  : "after:task",
		"beforeUndo" : "before:undo",
		"afterUndo"  : "after:undo",
		"onProgress" : "progress"
	};

	for (var handler in eventMap) {
		if (isFunction(config[handler])) {
			this.on(eventMap[handler], config[handler]);
		}
	}

	
	// Instance methods --------------------------------------------------------
	
	
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
		//if (this.isEmpty()) 
		//	throw new Error("The transaction has no tasks");
		if (this.isComplete()) 
			throw new Error("The transaction is already complete");
		if (this.isStarted()) 
			throw new Error("The transaction is already running");
		
		this.emit("start");
		this.next();
	};

	/**
	 * Resets the transaction
	 * @throws {Error} if the transaction is currently running
	 * @return {void}
	 * @method reset
	 * @memberof Transaction.prototype
	 */
	this.reset = function(silent) 
	{
		if (this.isStarted() && !this.isComplete()) 
			throw new Error("Cannot reset a transacion while it is runing");
		
		if (timer) clearTimeout(timer);
		if (delay) clearTimeout(delay);
		
		tasks.splice(0, length);

		length    = tasks.length;
		position  = length - 1;
		weight    = 0;
		lastError = "";

		if (!silent)
			this.emit("reset");
	};

	this.destroy = function()
	{
		this.reset(true);
		this.off();
	};

	/**
	 * Appends new task to the transaction queue.
	 * @param {Task|Transaction} task The task or sub-transaction to 
	 * 		add to the queue
	 * @throws {Error} If the transaction has already been started
	 * @return {void}
	 * @todo Allow for adding Transaction objects to create nested transactions
	 */
	this.add = function add(task) 
	{
		//if (this.isStarted()) 
		//	throw "The transaction has already ran";

		// Add nested transaction. In this case create new generic task that 
		// wraps the entire nested transaction
		if (task && task instanceof Transaction)
		{
			var tx = task;
			
			task = Transaction.createTask({
				name : "Nested transaction",
				execute : function(next) 
				{
					tx.on("complete", next);
					tx.on("error", next);
					tx.start();
				},
				undo : function(next) 
				{
					tx.on("rollback", function() {
						var args = Array.prototype.slice.call(arguments);
						args.unshift(null);
						next.apply(tx, args);
					});
					tx.rollback();
				}
			});

			tx.parentTransaction = this;

			weight += tx.getWeight();
		}
		else
		{
			weight += task.weight || 1;
			if (this.parentTransaction) {
				this.parentTransaction.setWeight(
					this.parentTransaction.getWeight() + (task.weight || 1)
				);
			}
		}

		task.transaction = this;
		length = tasks.push(task);
		task.name += " (at position " + length + ")";
	};

	/**
	 * Undoes all the completed actions on failure.
	 * @return {void}
	 */
	this.rollback = function(callerPosition) {
		if (timer) clearTimeout(timer);
		if (delay) clearTimeout(delay);
		
		// Such a call might come from within a task that has already been 
		// "outdated" due to timeout
		if (callerPosition !== undefined && callerPosition !== position) {
			return;
		}

		if (position < 0) {
			this.emit("rollback", lastError);
			return;
		}

		var task = tasks[position--], inst = this;
		function onTaskUndo(err) {
			inst.emit("progress", inst.getProgress(), task, position + 1);
			inst.emit("after:undo", task, position + 1);
			if (err) {
				inst.emit("error", err || "Task '" + task.name + "' failed to undo");
			}
			inst.rollback();
		}

		this.emit("before:undo", task, position + 1);

		try {
			task.undo(onTaskUndo);
		} catch (ex) {
			this.emit("error", ex);
			this.rollback();
		}
	};

	/**
	 * Checks if the transaction has been started
	 * @return {Boolean}
	 */
	this.isStarted = function() 
	{
		return position > -1;
	};

	/**
	 * Checks if the transaction is complete
	 * @return {Boolean}
	 */
	this.isComplete = function() 
	{
		return !this.isEmpty() && position === length - 1;
	};
	
	/**
	 * Checks if the transaction is empty
	 * @return {Boolean}
	 */
	this.isEmpty = function() 
	{
		return length === 0;
	};

	/**
	 * Calculates and returns the current position as a floating point number.
	 * This tipically represents ho many of the available tasks are complete,
	 * but can also be more complicated because each task can have it's own 
	 * weight defined which affects this number.
	 * @return {Number}
	 */
	this.getProgress = function() 
	{
		var cur = 0, i;
		for (i = 0; i <= position; i++) {
			cur += tasks[i].weight || 1;
		}
		return cur / weight;
	};

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

	/**
	 * The function that attempts to invoke the next task in the queue
	 */
	this.next = function(callerPosition) 
	{
		// clear times if needed
		if (timer) clearTimeout(timer);
		if (delay) clearTimeout(delay);

		// Such a call might come from within a task that has already been 
		// "outdated" due to timeout
		if (callerPosition !== undefined && callerPosition !== position) {
			return;
		}

		if (!this.isComplete() && !this.isEmpty()) {
			(function worker(task, pos, inst) {
				var _timeout = "timeout" in task ? task.timeout : config.timeout;
				
				if ( _timeout > 0 ) {
					timer = setTimeout(function() {
						lastError = "Task '" + task.name + "' timed out!.";
						inst.emit("error", lastError);
						if (config.autoRollback) 
							inst.rollback(pos);
					}, _timeout + config.delay);
				}

				function onTaskFinsh(err) {
					if (pos === position) {
						if (err) {
							lastError = err || "Task '" + task.name + "' failed.";
							inst.emit("error", lastError);
							if (config.autoRollback) inst.rollback(pos);
						} else {
							inst.emit("progress", inst.getProgress(), task, pos);
							inst.emit("after:task", task, pos);

							if (config.delay) {
								delay = setTimeout(function() {
									inst.next();
								}, config.delay);
							} else {
								nextTick(function() {
									inst.next();
								});
							}
						}
					}
				}

				inst.emit("before:task", task, pos);
				try {
					task.execute(onTaskFinsh);
				} catch (ex) {
					inst.emit("error", ex);
					if (config.autoRollback) 
						inst.rollback(pos);
				}
			})(tasks[++position], position, this);
		} else {
			this.emit("complete");
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
	execute : function(next) {
		console.warn(
			"The 'execute' method for task '" + this.name + 
			"' is not implemented!"
		);
		next();
	},

	/**
	 * The function that undoes the task
	 * @param {Function} done The implementation MUST call this after the job is
	 *		successfully completed
	 * @param {Function} fail The implementation MUST call this if the job has
	 *		failed
	 * @return {void}
	 */
	undo : function(next) {
		console.warn(
			"The 'undo' method for task '" + this.name + 
			"' is not implemented!"
		);
		next();
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
	var lastUsedDB = walker.server.getCurrentDatabase();

	function undo(next) {
		if (lastUsedDB) {
			walker.server.setCurrentDatabase(lastUsedDB.name);
			next(null, 'Current database restored to "' + lastUsedDB.name + '".');
		} else {
			next();
		}
	}
	
	return new Task({
		name : "Use Database",
		execute : function(next) {
			var dbName;
			walker.someType(WORD_OR_STRING, function(token) {
				dbName = token[0];
			})
			.errorUntil(";")
			.commit(function() {
				var err = null, out = null;
				try {
					walker.server.setCurrentDatabase(dbName);
					lastUsedDB = walker.server.getCurrentDatabase();
					out = 'Database "' + dbName + '" selected.';
				} catch (ex) {
					err = ex;
				}
				next(err, out);
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
		execute : function(next) {
			walker.errorUntil(";").commit(function() {
				next(null, {
					cols : ["Databases"],
					rows : keys(walker.server.databases).map(makeArray)
				});
			});
		},
		undo : function(next) {
			next(); // Nothing to undo here...
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
		execute : function(next) {
			var db = walker.server.getCurrentDatabase(), dbName;

			if ( walker.is("FROM|IN") ) 
			{
				walker.forward();
				walker.someType(WORD_OR_STRING, function(token) {
					dbName = token[0];
					db = walker.server.databases[dbName];
				});
			}
			
			walker.nextUntil(";").commit(function() {
				if (!db) {
					if (dbName) {
						next(new SQLRuntimeError('No such database "%s"', dbName), null);
					} else {
						next(new SQLRuntimeError('No database selected'), null);
					}
				} else {
					next(null, {
						cols : ['Tables in database "' + db.name + '"'],
						rows : keys(db.tables).map(makeArray)
					});
				}
			});
		},
		undo : function(next) {
			next();// Nothing to undo here...
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
		execute : function(next) {
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
						walker.server.databases[dbName] : 
						walker.server.getCurrentDatabase(), 
					table;
				
				if (!database) {
					if ( dbName ) {
						return next(new SQLRuntimeError('No such database "%s"', dbName), null);
					} else {
						return next(new SQLRuntimeError('No database selected'), null);
					}
				}
				
				table = database.tables[tableName];

				if (!table)
				{
					return next(new SQLRuntimeError(
						'No such table "%s" in databse "%s"',
						tableName,
						database.name
					), null);
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

				next(null, result);
			});
		},
		undo : function(next) {
			next(); // Nothing to undo here....
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

	function undo(next) {
		if (dbName) {
			walker.server.dropDatabase(dbName, true, next);
		} else {
			next();
		}
	}

	return new Task({
		name : "Create Database",
		execute : function(next) {
			var ifNotExists = false, name = "";
			
			// Make sure to reset this in case it stores something from 
			// previous query
			dbName = null;

			walker
			.optional("IF NOT EXISTS", function() {
				ifNotExists = true;
			})
			.someType(WORD_OR_STRING, function(token) {
				name = token[0];
			})
			.nextUntil(";")
			.commit(function() {
				dbName = name;
				walker.server.createDatabase(name, ifNotExists, function(err) {
					next(err, err ? null : 'Database "' + name + '" created.');
				});
			});
		},
		undo : undo
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

	function undo(next) 
	{
		if (tableName) {
			var db = walker.server.getCurrentDatabase();
			if (db) {
				var table = db.tables[tableName];
				if (table) {
					return next("Droping tables is not fully implemented yet!");
				}
			}
			//walker.server.dropDatabase(dbName, true, done, fail);
			next();
		} else {
			next();
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
		query.constraints.push(constraint);
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
		execute : function(next) {
			
			var q = {
				name        : "",
				temporary   : walker.lookBack(2)[0].toUpperCase() == "TEMPORARY",
				ifNotExists : false,
				columns     : [],
				constraints : []
			};


			// Make sure to reset this in case it stores something from 
			// previous query
			tableName = null;

			
			walker
			.optional("IF NOT EXISTS", function() {
				q.ifNotExists = true;
			})
			.someType(WORD_OR_STRING, function(token) {
				q.name = token[0];
			})
			.optional("(", function() {
				walk_createTableColumns(q);
			})
			.nextUntil(";")
			.commit(function() {

				var db = walker.server.getCurrentDatabase();

				if (!db)
					return next(new SQLRuntimeError("No database selected"), null);

				tableName = q.name;

				db.createTable({
					name        : q.name, 
					fields      : q.columns,
					ifNotExists : q.ifNotExists,
					constraints : q.constraints
				}, function(err) {
					next(
						err || null, 
						err ? null : 'Table "' + q.name + '" created'
					);
				});
			});
		},
		undo : undo
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
		execute : function(next) {
			var q = {};
			walker.optional("IF EXISTS", function() {
				q.ifExists = true;
			})
			.someType(WORD_OR_STRING, function(token) {
				q.name = token[0];
			}, "for the database name")
			.errorUntil(";")
			.commit(function() {
				walker.server.dropDatabase(q.name, q.ifExists, function(err) {
					next(err, err ? null : 'Database "' + q.name + '" deleted.');
				});
			});
		},
		undo : function(next) {
			next("undo is not implemented for the DROP DATABASE queries");
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
		execute : function(next) {
			
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
				var database = walker.server.getDatabase(dbName), 
					table    = database.getTable(tableName, !ifExists);
				
				if (!table) {
					return next(null, null);
				}

				table.drop(function(err) {
					if (err)
						return next(err, null);
					
					next(
						null,
						'Table "' + database.name + '.' + table.name + '" deleted.'
					);
				});
			});
		},
		undo : function(next) {
			next(null, "undo is not implemented for the DROP TABLE queries");
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
		db,
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
		execute : function(next) {
			walker
			// TODO: with-clause
			
			// Type of insert --------------------------------------------------
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
			
			// table -----------------------------------------------------------
			.someType(WORD_OR_STRING, function(token) {
				tableName = token[0];
			})
			.optional(".", function() {
				walker.someType(WORD_OR_STRING, function(token) {
					dbName = tableName;
					tableName = token[0];
				});
			});

			db      = walker.server.getDatabase(dbName);
			table   = db.getTable(tableName);
			columns = keys(table.cols);
			
			// Columns to be used ----------------------------------------------
			walker.optional({ "(" : columnsList })
			
			// Values to insert ------------------------------------------------
			.pick({
				// TODO: Support for select statements here
				//"DEFAULT VALUES" : function() {
					// TODO
				//},
				"VALUES" : valueSet
			});
			
			// Finalize --------------------------------------------------------
			try {
				walker.errorUntil(";");
			} catch (ex) {
				return next(ex, null);
			}
			
			walker.commit(function() {
				/*console.dir({
					dbName    : dbName, 
					tableName : tableName, 
					table     : table,
					or        : or, 
					valueSets : valueSets,
					columns   : columns
				});*/
				table.insert(columns, valueSets, function(err) {
					next(err, err ? null : valueSets.length + ' rows inserted');
				});
			});
		},
		undo : function(next) {
			next("undo not implemented for INSERT queries!");
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
			isExpr   : true
		},
		name  = identifier,
		start = walker.current()[2],
		end   = walker.current()[3];

		if (options.allowAll)
			name += "|*";

		if (options.allowIndexes)
			name += "|@" + TOKEN_TYPE_NUMBER;

		if (options.includeAlias)
			out.alias = null;

		do {
			
			// Field name
			if (!walker.is(name)) break;
			out.field = walker.get();
			walker.forward();

			// Field table
			if (walker.is(".")) {
				walker.forward();
				if (!walker.is(name)) break;
				out.table = out.field;
				out.field = walker.get();
				walker.forward();

				// Field database
				if (options.includeDB && walker.is(".")) {
					walker.forward();
					if (!walker.is(name)) break;
					out.database = out.table;
					out.table    = out.field;
					out.field    = walker.get();
					walker.forward();
				}
			}

			// now check what we have so far
			if (isNumeric(out.field)) {
				out.field = intVal(out.field);
				if (out.field < 0)
					throw new SQLParseError('Negative column index is not allowed.');	

			} else if (!out.field)
				throw new SQLParseError('Expecting a field name');

			if (out.table == "*")
				throw new SQLParseError('You cannot use "*" as table name');
			else if (isNumeric(out.table))
				throw new SQLParseError('You cannot use number as table name');

			if (out.database == "*")
				throw new SQLParseError('You cannot use "*" as database name');
			else if (isNumeric(out.database))
				throw new SQLParseError('You cannot use number as database name');

			out.isExpr = false;

		} while (0);

		// so far the input might appear like a field refference but we can't be
		// sure yet!
		walker.nextUntil(",|AS|FROM|WHERE|GROUP|ORDER|LIMIT|OFFSET|;", function(tok) {
			end = tok[3];
			out.isExpr = true;
		}, true);

		if (out.isExpr)
			out.field = walker._input.substring(start, end);

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

		//console.dir(out);

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

			if ( !walker.is("@" + TOKEN_TYPE_NUMBER) )
				throw new SQLParseError(
					"Expecting a number for the LIMIT clause"
				);

			limit = intVal(walker.get());
			walker.forward();

			if (walker.is(",")) {
				if (!walker.forward().is("@" + TOKEN_TYPE_NUMBER))
					throw new SQLParseError(
						"Expecting a number for the offset part of the LIMIT clause"
					);

				offset = intVal(walker.get());
				walker.forward();
			}
		}

		if (walker.is("OFFSET")) {//console.log(walker._tokens[walker._pos]);
			walker.forward();
			if (!walker.is("@" + TOKEN_TYPE_NUMBER))
				throw new SQLParseError(
					"Expecting a number for the OFFSET clause"
				);

			offset = intVal(walker.get());
			walker.forward();
		}
		
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

		if (l)
			join.push("JOIN");

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
			tables[i] = walker
				.server
				.getDatabase(query.tables[i].database)
				.getTable(query.tables[i].table);

			//tables[i] = tables[query.tables[i].table] = getTable(
			//	query.tables[i].table,
			//	query.tables[i].database
			//);

			if (query.tables[i].alias)
				tables[query.tables[i].alias] = tables[i];
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

		for ( dbName in walker.server.databases )
		{
			db = walker.server.databases[dbName];
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
		//console.dir(query.fields);
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
			i, y, l, j, f, k;

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

			if (fld.table) {
				table = walker.server.getDatabase(fld.table.database).getTable(fld.table.table);

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
			if (fld.alias)
				ENV[fld.alias] = null;

			rowProto[i] = rowProto[fld.field] = col;
			if (fld.alias)
				rowProto[fld.alias] = col;

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
					table = walker.server.getDatabase(fld.database).getTable(fld.table);
					//table = getTable(fld.table, fld.database);
					for ( colName in table.cols ) 
						prepareField({
							field    : colName,
							alias    : null,
							table    : { table : table.name, database : table._db.name },
							database : table._db.name,
							isExpr   : false
						}, y++);
				}
				else
				{
					for ( j = 0; j < tablesLength; j++ ) 
					{
						table = tables[j];
						for ( colName in table.cols ) 
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
			else 
			{
				// If the field is not an expression and the number of used 
				// tables is not 1, require a table name to be specified
				if (!fld.isExpr && !fld.table) 
				{
					if ( tablesLength !== 1 )
						throw new SQLParseError(
							'The column "%s" needs to have it\'s table specified',
							fld.field
						);

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
				arr.push(table.rows[rowId].toJSON("object"));
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

					if (valA > valB)
						out += term.direction == "ASC" ? 1 : -1;
					else if (valA < valB)
						out += term.direction == "ASC" ? -1 : 1;

					if (out !== 0)
						break;
				}
				return out;
			});
		}

		var limit  = query.bounds.limit,
			offset = query.bounds.offset,
			len    = rows.length;

		if (offset < 0)
			offset = len + offset;

		l = rows.length;

		// Evaluate expressions in field list ----------------------------------
		for ( i = 0; i < l; i++ ) {
			row = rows[i];
			for ( fieldName in row ) {
				f = rowProto[fieldName];
				if (f && f.isExpr)
					row[fieldName] = executeCondition(row[fieldName], row);
			}
		}

		var rows2 = [];
		
    for ( i = 0, k = 0; i < l; i++, k++ ) {

      row = rows[i];

      // Apply the "WHERE" conditions
      // -----------------------------------------------------------------
      if (query.where && !executeCondition(query.where, row)) {
        k--;
        continue;
      }
            
      // Apply OFFSET
      // -----------------------------------------------------------------
      if (k < offset)
        continue;

      // Apply LIMIT -----------------------------------------------------
      if (limit && k >= offset + limit)
        continue;

			// Exclude unused fields from the result rows
			// -----------------------------------------------------------------
			for ( fieldName in row ) {
				f = rowProto[fieldName];
				if (!f || (f.alias && f.alias !== fieldName))
					delete row[fieldName];
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
		execute : function(next) {
			
			var query = {
				fields : [],
				tables : []
			};
			
			collectFieldRefs(query.fields);

			walker.optional({
				"FROM" : function() {//console.log("current: ", walker.current()[0]);
					collectTableRefs(query.tables);
				}
			});

			query.where   = walkWhere(); 
			query.orderBy = walkOrderBy();
			query.bounds  = walkLimitAndOffset();
			
			walker
			.errorUntil(";")
			.commit(function() {
				var result = execute(query);
				next(null, {
					cols : result.cols,
					rows : result.rows
				});
			});
		},
		undo : function(next) {
			next(); // There is nothing to undo after select
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
		execute : function(next)
		{
			//console.log(walker._input);
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
				end   = walker.current()[3];
				where = walker._input.substring(start, end);
			}
			else 
			{
				walker.errorUntil(";");
			}	

			walker.commit(function() {

				var db = dbName ?
						walker.server.getDatabase(dbName) :
						walker.server.getCurrentDatabase(),
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
				
				each(rows, function(row, rowId, allRows) {//console.log(where, row.toJSON(true));
					if ( !where || executeCondition( where, row.toJSON("mixed") ) )
					{
						len = rowIds.push(row);
					}
				});
				//console.log(2, rowIds, rows);

				if ( len ) 
				{
					table.deleteRows(rowIds, function(err) {
						next(err, err ? null : len + " rows deleted");
					});
				}
				else
				{
					next(null, len + " rows deleted");
				}
			});
		},
		undo : function(next) {
			if (walker.server.options.debug)
				console.warn("undo not implemented for DELETE queries!");
			next();
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
			walker.server.getDatabase(dbName) :
			walker.server.getCurrentDatabase();

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
		execute : function(next)
		{
			var or      = getAltBehavior(walker),
				table   = getTable(walker),
				updater = getUpdater(walker),
				where   = getWhere(walker);

			walker.errorUntil(";").commit(function() {
				table.update(
					updater, 
					or, 
					where, 
					function() {
						next(null, "DONE");
					}, 
					function(e) {
						next(e, null);
					}
				);
			});
		},
		undo : function(next) {
			if (walker.server.options.debug)
				console.warn("undo is not implemented for UPDATE queries yet!");
			next();
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
		execute : function(next) {
			
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
				walker.server.beginTransaction({ type : type });
				next(null, "Transaction created");
			});
		},
		undo : function(next) {
			walker.server.rollbackTransaction(next);
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
		execute : function(next) {
			if (walker.is("TRANSACTION"))
				walker.forward();
			
			walker.errorUntil(";");

			walker.commit(function() {
				walker.server.commitTransaction();
				next();
			});
		},
		undo : function(next) {
			walker.server.rollbackTransaction(next);
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
		execute : function(next) {
			if (walker.is("TRANSACTION"))
				walker.forward();
			
			walker.errorUntil(";");

			walker.commit(function() {
				walker.server.rollbackTransaction();
				next();
			});
		},
		undo : function(next) {
			walker.server.commitTransaction();
			next();
		}
	});
};


// -----------------------------------------------------------------------------
// Starts file "src/statements/source.js"
// -----------------------------------------------------------------------------

STATEMENTS.SOURCE = function(walker) {
	return new Task({
		name : "SOURCE Command",
		execute : function(next) {
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
				if (!url)
					return next(new SQLParseError("No path specified"), null);

				xhr = new XMLHttpRequest();
				xhr.open("GET", url, true);
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						if (xhr.status == 200 || xhr.status == 304) {
							var queries = getQueries(xhr.responseText),
								len = queries.length;

							walker.server.query(queries, function(err, result, idx) {
								if (err) {
									return next(
										err ? err : new SQLRuntimeError(
											'Error executing query:\n%s',
											queries[idx].sql
										), 
										null
									);
								}

								if (idx === len - 1) {
									walker.server.save(function(err) {
										next(err, err ? null : strf(
											'%s queries executed successfuly from file "%s"',
											len,
											url
										));
									});
								}
							});
						} else {
							next(new SQLRuntimeError(xhr.statusText), null);
						}
					}
				};
				xhr.send(null);
			});
		},
		undo : function(next) {
			if (walker.server.options.debug)
				console.warn("The SOURCE command cannot be undone!");
			next("The SOURCE command cannot be undone!");
		}
	});
};

// -----------------------------------------------------------------------------
// Starts file "src/storage/StorageBase.js"
// -----------------------------------------------------------------------------
var Storage = (function() {

	var engines         = {},
		engineInstances = {},
		baseProto       = {};

	each(["set", "get", "unset", "setMany", "getMany", "unsetMany"], function(name) {
		var fn = arguments[arguments.length - 1];
		fn = isFunction(fn) ? fn : function(msg) {
			throw msg;
		};
		baseProto[name] = function() {
			fn('Action "' + name + '" failed. Method not implemented.');
		};
	});

	baseProto.load = function(cb) {
		cb(null, this);
	};

	var StorageBase = Class.extend(baseProto);

	function getRegisteredEngines() {
		var out = {};
		each(engines, function(fn, name) {
			out[name] = fn.label || name;
		});
		return out;
	}

	function registerEngine(name, proto, statics) {
		if (engines[name])
			throw new Error(
				'Storage engine "' + name + '" is already registered.'
			);
		
		engines[name] = StorageBase.extend(proto, statics);
		return engines[name];
	}

	function getEngine(options, cb) {
		var storage = engineInstances[options.type], EngineClass;
		if (!storage) {
			EngineClass = engines[options.type];
			if (!EngineClass)
				throw new Error(
					'No such ttorage engine "' + options.type + '".'
				);
			storage = new EngineClass(options);
			storage.load(function(err) {
				if (err)
					return cb(err, null);
				engineInstances[options.type] = storage;
				cb(null, storage);
			});
		} else {
			cb(null, storage);
		}
	}

	jsSQL.getStorageEngine            = getEngine;
	jsSQL.registerStorageEngine       = registerEngine;
	jsSQL.getRegisteredStorageEngines = getRegisteredEngines;

	return {
		getEngine      : getEngine,
		registerEngine : registerEngine
	};

})();

/**
 * @classdesc The Storage is a singleton storage manager
 
var Storage = (function() {
	var engines = {},
		engineInstances = {};

	var proto = {};

	each(["set", "get", "unset", "setMany", "getMany", "unsetMany"], function(name) {
		var fn = arguments[arguments.length - 1];
		fn = isFunction(fn) ? fn : function(msg) {
			throw msg;
		};
		proto[name] = function() {
			fn('Action "' + name + '" failed. Method not implemented.');
		};
	});

	proto.load = function(cb) {
		cb(null, this);
	};
	
	return {
		
		getEngine : function(options, cb) {
			var storage = engineInstances[options.type];
			if (!storage) {
				storage = new engines[options.type](options);
				storage.load(function(err) {
					if (err)
						return cb(err, null);
					engineInstances[options.type] = storage;
					cb(null, storage);
				});
			} else {
				cb(null, storage);
			}
		},

		registerEngine : function(name, constructor) {
			if (engines[name])
				throw new Error(
					'Storage engine "' + name + '" is already registered.'
				);
			engines[name] = constructor;
		},

		proto : proto
	};
})();*/


// -----------------------------------------------------------------------------
// Starts file "src/storage/LocalStorage.js"
// -----------------------------------------------------------------------------
(function() {
	function _setMany(map) {
		for ( var key in map )
			localStorage.setItem( key, JSON.stringify(map[key]) );
	}

	function _getMany(keys) {
		var out = [];
		for (var i = 0, l = keys.length; i < l; i++)
			out.push( JSON.parse(localStorage.getItem( keys[i] )) );
		return out;
	}

	function _unsetMany(keys) {
		for (var i = 0, l = keys.length; i < l; i++)
			localStorage.removeItem( keys[i] );
	}

	function _set(key, value) {
		localStorage.setItem( key, JSON.stringify(value) );
	}

	function _get(key) {
		return JSON.parse(localStorage.getItem( key ));
	}

	function _unset(key) {
		localStorage.removeItem( key );
	}

	/**
	 * Class LocalStorage extends StorageBase
	 * @extends {StorageBase}
	 */
	jsSQL.registerStorageEngine("LocalStorage", {

		/**
		 * @constructor
		 */
		construct : function LocalStorage() {
			if (!window.localStorage || !isFunction(localStorage.setItem))
				throw new Error("localStorage is not supported");
		},

		setMany : function(map, next) {
			nextTick(function() {
				var err = null;
				try {
					_setMany(map);
				} catch (ex) {
					err = ex;
				}
				//if (next)
					next(err);
			});
		},

		getMany : function(keys, next) {
			nextTick(function() {
				var err = null, out = [];
				try {
					out = _getMany(keys);
				} catch (ex) {
					err = ex;
				}
				//if (next)
					next(err, out);
			});
		},

		/**
		 * Delete multiple items. If everything goes well, calls the onSuccess
		 * callback. Otherwise calls the onError callback.
		 * @param {Array} keys - An array of keys to delete
		 * @param {Function} onSuccess - This is called on success without arguments
		 * @param {Function} onError - This is called on error with the error as
		 * single argument
		 * @return {void} undefined - This method is async. so use the callbacks
		 */
		unsetMany : function(keys, next) {
			nextTick(function() {
				var err = null;
				try {
					_unsetMany(keys);
				} catch (ex) {
					err = ex;
				}
				//if (next)
					next(err);
			});
		},

		set : function(key, value, next) {
			nextTick(function() {
				var err = null;
				try {
					_set( key, value );
				} catch (ex) {
					err = ex;
				}
				//if (next)
					next(err);
			});
		},
		
		get : function(key, next) {
			nextTick(function() {
				var err = null, out;
				try {
					out = _get( key );
				} catch (ex) {
					err = ex;
				}
				//if (next)
					next(err, out);
			});
		},
		
		unset : function(key, next) {
			nextTick(function() {
				var err = null;
				try {
					_unset( key );
				} catch (ex) {
					err = ex;
				}
				//if (next) 
					next(err);
			});
		}
	}, {
		label : "Local Storage"
	});
})();

// -----------------------------------------------------------------------------
// Starts file "src/Persistable.js"
// -----------------------------------------------------------------------------
/**
 * @constructor
 * @abstract
 * @classdesc The base class for persistable objects. Provides the basic 
 * methods for key-value based async. persistance and some base methods for
 * composite operations
 */
var Persistable = Class.extend({

	/**
	 * @constructor
	 */
	construct : function(label, parent) {
		
		this.label = label || "persistable";

		/**
		 * The storage engine instance used by this object.
		 */
		this.storage = parent ? parent.storage : null;

		/**
		 * This flag is managed internally and shows if the instance has unsaved
		 * changes
		 * @type {Boolean}
		 */
		this._isDirty = false;

		this.children = {};

		this.parent = parent || null;

		this.bubbleTarget = this.parent;

		// Make it observable
		Observer.call(this);
	},
	
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

	getPatch : function() 
	{
		var hasChanges = false, out = {}, name, child, patch;

		if (this._isDirty) {
			hasChanges = true;
			out[this.getStorageKey()] = this.toJSON();//JSON.stringify(this.toJSON());
		}

		for ( name in this.children) {
			child = this.children[name];
			patch = child.getPatch();
			if (patch) {
				hasChanges = true;
				mixin(out, patch);
			}
		}

		return hasChanges ? out : null;
	},
	
	/**
	 * This method attempts to read the serialized version of the instance from
	 * the storage and parse it to JS Object
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
	read : function(next)
	{
		this.storage.get(this.getStorageKey(), function(err, data) {
			next(err, err ? null : data);
		});
	},
	
	/**
	 * Saves the data in the storage.
	 * @param {Object|Array} data - The data to store
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
	write : function(data, next)
	{
		this.storage.set(this.getStorageKey(), data, next);
	},
	
	/**
	 * Deletes the corresponding data from the storage.
	 * @param {Function} onSuccess An "error-first" style callback
	 * @return {void}
	 */
	drop : function(next)
	{
		this.storage.unset(this.getStorageKey(), next);
	},
	
	/**
	 * Saves the instance (as JSON) in the storage.
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
	save : function(next) 
	{
		var self  = this, 
			cb    = createNextHandler(next),
			patch = self.getPatch();

		if (!patch)
			return cb(null, self);

		self.emit("savestart:" + self.label, self);

		if (self.parent) {
			self.parent.save(self.onSave(cb));
		} else {
			self.storage.setMany(patch, self.onSave(cb));
		}
		//this.write( this.toJSON(), cb );
	},

	onSave : function(cb) 
	{
		var self = this;
		return function(err) {
			if (err) 
				return cb(err, self);
			self._isDirty = false;
			self.emit("save:" + self.label, self);
			cb(null, self);
		};
	},
	
	/**
	 * Reads the corresponding data from the storage.
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 */
	load : function(next)
	{
		this.read(next);
	}
});



// -----------------------------------------------------------------------------
// Starts file "src/Server.js"
// -----------------------------------------------------------------------------

var Server = Persistable.extend({

	/**
	 * @constructor
	 * @classdesc The Server class is used to create a single instance that is a 
	 * persistable collection of databases.
	 * @extends {Persistable}
	 */
	construct : function(options)
	{
		Persistable.prototype.construct.call(this, "server");

		/**
		 * The current transaction (if any)
		 * @type {Transaction}
		 */
		this._transaction = null;

		/**
		 * The databases currently in this server
		 * @type {Object}
		 * @private
		 */
		this.databases = {};

		/**
		 * The configuration options for the instance
		 * @type {Object}
		 */
		this.options = {};

		this._queryTasks = {};

		// Make the server instance observable
		//Observer.call(this);

		// Apply the configuration
		this.config(mixin({
			debug : false,
			storageEngine : {
				type : "LocalStorage"
			}
		}, options));

		this.children = this.databases;

		this._init();
	},

	destroy : function(cb) 
	{
		this.off();
		this._destroyTransaction();
		this.children = this.databases = {};
		this.options = {};
		this._queryTasks = {};
	},

	config : function(name, value) {
		var l = arguments.length;
		
		if (!l) {
			return this.options;
		}

		if (l === 1) {
			if (name && typeof name == "object") {
				mixin(this.options, name);
				return this;
			}
			return this.options[name];
		}

		this.options[name] = value;
		return this;
	},

	/**
	 * Checks whether there is a pending transaction
	 * @return {Boolean}
	 */
	isInTransaction : function()
	{

		return !!this._transaction;
	},

	/**
	 * Gets the current transaction (if any)
	 * @return {Transaction|null}
	 */
	getTransaction : function()
	{

		return this._transaction || null;
	},

	_destroyTransaction : function() 
	{
		if (this._transaction) {
			this._transaction.destroy();
			this._transaction = null;
		}
	},

	/**
	 * Starts new transaction
	 */
	beginTransaction : function(options)
	{
		if (this.isInTransaction())
			throw new SQLRuntimeError(
				"There is a current transaction already started"
			);

		this._transaction = new Transaction(mixin({ 
			debug : this.options.debug
		}, options));
		
		var server = this;
			
		this._transaction.on("rollback", function(e, error) {
			server._destroyTransaction();
		});

		this._transaction.on("complete", function() {
			server._destroyTransaction();
		});

		return this._transaction;
	},

	commitTransaction : function()
	{
		if (!this.isInTransaction())
			throw new SQLRuntimeError("There is no current transaction");

		this._transaction.start();
	},

	rollbackTransaction : function(next)
	{
		if (!this._transaction) {
			next(new SQLRuntimeError("There is no current transaction"));
		}

		if (next) {
			this._transaction.one("rollback", function() {
				next();
			});
		}

		this._transaction.rollback();
	},

	/**
	 * Return the storage key for the server object. This is used to identify it
	 * inside a key-value based storage.
	 * @return {String}
	 */
	getStorageKey : function()
	{

		return NS;
	},

	/*getPatch : function() 
	{
		var hasChanges = false, out = {}, dbName, db, patch;

		if (this._isDirty) {
			hasChanges = true;
			out[this.getStorageKey()] = JSON.stringify(this.toJSON());
		}

		for ( dbName in this.databases) {
			db = this.databases[dbName];
			patch = db.getPatch();
			if (patch) {
				hasChanges = true;
				mixin(out, patch);
			}
		}

		return hasChanges ? out : null;
	},*/

	/**
	 * Overrides {@link Persistable.prototype.toJSON}
	 * @return {Object}
	 */
	toJSON : function()
	{
		var json = { databases : {} };
		for ( var name in this.databases ) {
			json.databases[name] = this.databases[name].getStorageKey();
		}
		return json;
	},

	/**
	 * Loads the server from the storage. This will recursively load the 
	 * databases, tables and rows.
	 * @param {Function} next(error, server)
	 * @return {Server}
	 */
	load : function(next)
	{
		var server = this,
			trx = new Transaction({
				name    : "Load Server",
				timeout : 10000,
				debug   : !!this.options.debug
			}),
			_next = createNextHandler(next);

		trx.on("complete", function(e) {
			server.loaded = true;
			server.emit("load:server", server);
			_next(null, server);
		});

		trx.on("rollback", function(e, err) {
			_next(err, null);
		});

		function createDatabaseLoader(dbName) {
			trx.add(Transaction.createTask({
				name : "Load Database '" + dbName + "'",
				execute : function(next) {
					var db = new Database(dbName, server);
					server.databases[db.name] = db;
					db.load(next);
				},
				undo : function(next) {
					next(null);
				}
			}));
		}

		trx.add(Transaction.createTask({
			name : "Load Server Storage",
			execute : function(next) {
				Storage.getEngine(server.options.storageEngine, function(err, store) {
					if ( err )
						return next(err, null);

					server.storage = store;
					next(null, store);
				});
			}
		}));

		trx.add(Transaction.createTask({
			name : "Load Server",
			timeout : 10000,
			execute : function(next) {
				//server.children = server.databases = {};

				server.read(function(err, json) {
					if ( err )
						return next(err, server);

					server.children = server.databases = {}; // Clear current databases (if any)

					if ( !json || !json.databases )
						return next(null, server);

					for ( var dbName in json.databases ) {
						createDatabaseLoader(dbName);
					}

					server._isDirty = false;
					return next(null, server);
				});
			}
		}));

		server.emit("loadstart:server", server);
		trx.start();
		return server;
	},

	/*save : function(next) 
	{
		var server = this,
			_next  = createNextHandler(next),
			patch  = server.getPatch();

		if (!patch)
			return _next(null, server);

		server.emit("savestart:server", server);
		//console.log("Changes:\n%s", JSON.stringify(patch, null, 4));
		server.storage.setMany(patch, function(err) {
			if (err)
				return _next(err, null);

			server._isDirty = false;
			server.emit("save:server", server);
			_next(null, server);
		});

		return server;
	},*/

	/**
	 * Creates and returns new Database
	 * @param {String} name The name of the database to create
	 * @param {Boolean} ifNotExists Note that an exception will be thrown if such 
	 * database exists and this is not set to true.
	 * @param {Function} next(error, server)
	 * @return {void}
	 */
	createDatabase : function(name, ifNotExists, next) 
	{
		var _next = createNextHandler(next),
			server = this;

		if (typeof name != "string")
			return _next(
				new SQLRuntimeError("Invalid database name"),
				null
			);

		if (!name)
			return _next(
				new SQLRuntimeError("No database name"),
				null
			);

		if (server.databases.hasOwnProperty(name)) {
			if (!ifNotExists) {
				return _next(
					new SQLRuntimeError('Database "' + name + '" already exists'),
					null
				);
			}
			return _next(null, server.databases[name]);
		}

		var db = new Database(name, server);
		server.databases[name] = db;
		server._isDirty = true;
		this.save(function(err) {
			if (err) {
				delete server.databases[name];
				return _next(err, db);
			}
			_next(null, db);
		});
		//db.save(function(err) {
		//	if (err) {
		//		delete server.databases[name];
		//		return _next(err, db);
		//	}
		//	_next(null, db);
		//});
	},

	/**
	 * Drops a database from the server.
	 * @param {String} name The name of the database to drop
	 * @param {Boolean} ifNotExists Note that an exception will be thrown if such 
	 * database does not exists and this is not set to true.
	 * @return {void}
	 */
	dropDatabase : function(name, ifExists, next) 
	{
		var _next  = createNextHandler(next),
			server = this,
			db     = server.databases[name],
			tableName,
			table,
			rowID,
			prefix,
			keys;

		if (!db)
			return _next(
				ifExists ? 
					null : 
					new SQLRuntimeError('Database "' + name + '" does not exist'), 
				server
			);

		keys = [db.getStorageKey()];
		for ( tableName in db.tables ) {
			table = db.tables[tableName];
			prefix = table.getStorageKey();
			keys.push( prefix );
			for ( rowID in table.rows ) {
				keys.push(prefix + "." + rowID);
			}
		}

		server._isDirty = true;
		server.storage.unsetMany(keys, function(err) {
			if (err)
				return _next(err, server);

			if (server.currentDatabase === db)
				server.currentDatabase = null;

			delete server.databases[name];

			server.save(function(err) {
				_next(err, server);
			});
		});
			
		/*server.databases[name].drop(function(err, db) {
			if (err)
				return _next(err, server);

			if (server.currentDatabase === db)
				server.currentDatabase = null;

			delete server.databases[name];

			server.save(function(err) {
				_next(err, server);
			});
		});*/
	},

	/**
	 * Get a database by name.
	 * @param {String} name - The name of the desired database
	 * @return {Database|undefined}
	 */
	getDatabase : function(name, throwError)
	{
		var db;
		if (!name) {
			db = this.currentDatabase;
			if (!db) {
				if (throwError === false)
					return null;

				throw new SQLRuntimeError( 'No database selected.' );
			}
		} else {
			db = this.databases[name];
			if (!db) {
				if (throwError === false)
					return null;
				
				throw new SQLRuntimeError( 'No such database "%s"', name );
			}
		}
		
		return db;
	},

	/**
	 * Selects the specified database as the currently used one.
	 * @throws {SQLRuntimeError} error If the databse does not exist
	 * @return {Server} Returns the Server instance
	 */
	setCurrentDatabase : function(name)
	{
		var db = trim(name);
		if (!this.databases.hasOwnProperty(db)) {
			throw new SQLRuntimeError('No such database "%s".', db);
		}
		this.currentDatabase = this.databases[db];
		return this;
	},

	/**
	 * Returns the currently used database (if any).
	 * @return {Database|undefined}
	 */
	getCurrentDatabase : function()
	{
		return this.currentDatabase || null;
	},

	getTable : function(tableName, dbName, throwError)
	{			
		var db = this.getDatabase(dbName, throwError), 
			table;

		if (!db) 
			return null;
		
		table = db.tables[tableName];

		if (!table) {
			if (throwError === false) 
				return null;
			
			throw new SQLRuntimeError(
				'No such table "%s" in database "%s"',
				tableName,
				db.name
			);
		}
		
		return table;
	},

	_init : function() {
		var server = this;

		each({
			"SHOW DATABASES"         : "SHOW_DATABASES",
			"SHOW SCHEMAS"           : "SHOW_DATABASES",
			"SHOW TABLES"            : "SHOW_TABLES",
			"SHOW COLUMNS"           : "SHOW_COLUMNS",
			"CREATE DATABASE"        : "CREATE_DATABASE",
			"CREATE SCHEMA"          : "CREATE_DATABASE",
			"CREATE TABLE"           : "CREATE_TABLE",
			"CREATE TEMPORARY TABLE" : "CREATE_TABLE",
			"DROP DATABASE"          : "DROP_DATABASE",
			"DROP SCHEMA"            : "DROP_DATABASE",
			"DROP TABLE"             : "DROP_TABLE",
			"DROP TEMPORARY TABLE"   : "DROP_TABLE",
			"SELECT"                 : "SELECT",
			"USE"                    : "USE",
			"UPDATE"                 : "UPDATE",
			"INSERT"                 : "INSERT",
			"DELETE"                 : "DELETE",
			"SOURCE"                 : "SOURCE",
			"BEGIN"                  : "BEGIN"
		}, function(name, stmt) {
			this._queryTasks[stmt] = this._createQueryTask(name);
		}, this);

		this._queryTasks.COMMIT = this._queryTasks.END = function(index, next) {
			var tx = server.getTransaction(), walker = this, result;
			
			if (!tx) {
				return next(
					new SQLRuntimeError("There is no transaction to commit"), 
					null, 
					index
				);
			}

			result = new Result();

			if (tx.isEmpty()) {
				STATEMENTS.COMMIT(walker).execute(noop);
				result.setData("Empty transaction committed");
				next(null, result, index);
			} else {
				result.setData("Transaction committed");
				next(null, result, index);
				tx.one("complete", function() {
					result.setData("Transaction complete");
					next(null, result, index);
				});
				tx.one("rollback", function(e, err) {
					next(
						new SQLRuntimeError(
							"Transaction rolled back!" + (err ? "\n" + err : "")
						), 
						null,
						index
					);
				});
				STATEMENTS.COMMIT(walker).execute(noop);
			}
		};

		this._queryTasks.ROLLBACK = function(index, next) {
			var tx = server.getTransaction(), walker = this, result;

			if (!tx) {
				return next(
					new SQLRuntimeError("There is no transaction to rollback"), 
					null, 
					index
				);
			}

			result = new Result();

			if (tx.isEmpty()) {
				STATEMENTS.ROLLBACK(walker).execute(noop);
				result.setData("Empty transaction rolled back");
				next(null, result, index);
			} else {
				tx.one("rollback", function() {
					result.setData("Transaction rolled back!");
					next(null, result, index);
				});
				STATEMENTS.ROLLBACK(walker).execute(noop);
			}
		};
	},


	_handleQuery : function(queries, index, callback, len) {
		
		var query = queries[index], server = this;

		// All done already
		if (!query) 
			return;

		if (this.options.debug)
			console.info("Query: ", query.sql);

		try {
			(new Walker(query.tokens, query.sql, this)).pick(
				this._queryTasks, 
				false, 
				[
					index, 
					function(err, result, queryIndex) {
						callback(err, result, queryIndex, len);
						if (!err)
							server._handleQuery(
								queries, 
								index + 1, 
								callback, 
								len
							);
					}
				]
			);
		} catch (ex) {
			callback(ex, null, index, len);
		}
	},

	_createQueryTask : function(name) {
		var server = this;
		return function(queryIndex, next) {
			var fn = STATEMENTS[name],
				tx = server.getTransaction(),
				result = new Result(),
				walker = this,
				task;
			
			if (tx) {
				task = fn(walker);
				tx.add(Transaction.createTask({
					name : name,
					execute : function(_next) {
						var _result = new Result();
						task.execute(function(err, res) {
							if (err) {
								task.undo(function() {
									_next(err);
								});
							} else {
								_result.setData(res);
								next(null, _result, queryIndex);
								_next();
							}
						});
					},
					undo : function(_next) {
						task.undo(function() {
							_next();
						});
					}
				}));
				result.setData(name + " query added to the transaction");
				next(null, result, queryIndex);
			} else {
				task = fn(walker);
				task.execute(function(err, r) {
					if (err) {
						return task.undo(function() {
							next(err, null, queryIndex);	
						});
					}
					result.setData(r);
					next(null, result, queryIndex);
				});
			}
		};
	},

	query : function(sql, callback) {
		var queries, len;

		// First we need to split the SQL into queries because the behavior is
		// very different for single vs multiple queries
		try {
			queries = sql instanceof QueryList ? sql : getQueries(sql);
		} catch (err) {
			return callback(err, null, -1, 0);
		}

		// The number of SQL queries
		len = queries.length;

		if (!len) {
			return callback(null, new Result("No queries executed"));
		}

		this._handleQuery(queries, 0, callback, len);
	}
});


// -----------------------------------------------------------------------------
// Starts file "src/Database.js"
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                             Class Database                                 //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
var Database = Persistable.extend({
	
	/**
	 * @constructor
	 * @classdesc The Server class is used to create databases which are 
	 * persistable collections of tables.
	 * @extends {Persistable}
	 */
	construct : function(name, server) 
	{
		Persistable.prototype.construct.call(this, "database");
		this.tables  = {};
		this.name    = name;
		this.parent = this.server  = server;
		this.storage = server.storage;
		this.bubbleTarget = server;
		this.children = this.tables;

		//Observer.call(this);
	},

	/*getPatch : function() 
	{
		var hasChanges = false, out = {}, tableName, table, patch;

		if (this._isDirty) {
			hasChanges = true;
			out[this.getStorageKey()] = JSON.stringify(this.toJSON());
		}

		for ( tableName in this.tables) {
			table = this.tables[tableName];
			patch = table.getPatch();
			if (patch) {
				hasChanges = true;
				mixin(out, patch);
			}
		}

		return hasChanges ? out : null;
	},*/

	toJSON : function() 
	{
		var out = { name : this.name, tables : {} }, t;
		for (t in this.tables) {
			out.tables[t] = [NS, this.name, t].join(".");
		}
		return out;
	},

	getStorageKey : function() 
	{
		return NS + "." + this.name;
	},

	drop : function(next)
	{
		var _next = createNextHandler(next),
			db = this,
			tx = new Transaction({
				name : "Drop Database"
			}),
			name;

		function addDropTableTask(table) {
			tx.add(Transaction.createTask({
				name : 'Drop Table "' + table.name + '"',
				execute : function(next) {
					delete db.tables[table.name];
					table.drop(next);
				},
				undo : function(next) {
					db.tables[table.name] = table;
					next();
				}
			}));
		}

		tx.one("complete", function(e) {
			_next(null, db);
		});

		tx.one("rollback", function(e) {
			_next(e, db);
		});
		
		for ( name in db.tables ) {
			addDropTableTask( db.tables[name] );
		}

		tx.add(Transaction.createTask({
			name : 'Drop Database "' + db.name + '"',
			execute : function(next) {
				delete db.server.databases[db.name];
				Persistable.prototype.drop.call(db, next);
			},
			undo : function(next) {
				db.server.databases[db.name] = db;
				next();
			}
		}));
		
		tx.start();
	},

	load : function(next) 
	{
		var db    = this,
			tx    = new Transaction({
				name  : "Load Database",
				debug : !!this.server.options.debug
			}),
			_next = createNextHandler(next);

		function addLoadTableTask(table) {
			tx.add(Transaction.createTask({
				name : 'Load Table "' + table.name + '"',
				execute : function(next) {
					table.load(next);
				},
				undo : function(next) {
					next(null, table);
				}
			}));
		}

		db.emit("loadstart:database", db);

		tx.one("complete", function(e) {
			db.emit("load:database", db);
			_next(null);
		});

		tx.one("rollback", function(e, err) {
			_next(err);
		});

		tx.add(Transaction.createTask({
			name : "Create DB Tables",
			execute : function(next) {
				db.read(function(err, json) {
					if (err)
						return next(err, db);

					db.tables = {};

					if (!json || !json.tables)
						return next(null, db);

					for ( var name in json.tables ) {
						var table = new Table(name, db);
						db.tables[table.name] = table;
						addLoadTableTask(table);
					}

					db._isDirty = false;
					return next(null, db);
				});
			},
			undo : function(next) {
				console.warn("Undoing Create DB Tables task");
				next();
			}
		}));

		tx.start();

		return db;
	},

	/*save : function(next) 
	{
		var db = this,
			_next = createNextHandler(next);

		db.emit("savestart:database", db);
		//console.log("Changes in database %s:\n%s", this.name, JSON.stringify(this.getPatch(), null, 4));
		//Persistable.prototype.save.call(db, function(err) {
		//	if (err)
		//		return _next(err, null);

			db.server.save(function(err) {
				if (err)
					return _next(err, null);

				db._isDirty = false;
				db.emit("save:database", db);
				return _next(null, db);
			});
		//});

		return db;
	},*/

	/**
	 * { name: "", fields : [], constraints : [], ifNotExists : bool }
	 */
	createTable : function(cfg, next) {
		var _next = createNextHandler(next),
			db = this,
			table, 
			i, l;

		if (db.tables.hasOwnProperty(cfg.name) && !cfg.ifNotExists) {
			return _next(new SQLRuntimeError(
				'Table "%s" already exists', 
				cfg.name
			), null);
		}

		table = new Table(cfg.name, db);

		l = cfg.fields.length;
		for (i = 0; i < l; i++) {
			table.addColumn(cfg.fields[i]);
		}

		l = cfg.constraints.length;
		for (i = 0; i < l; i++) {
			table.addConstraint(cfg.constraints[i]);
		}

		db.tables[cfg.name] = table;
		db._isDirty = true;
		table.save(function(err) {
			if (err) {
				delete db.tables[cfg.name];
				return _next(err, null);
			}
			_next(null, table);
		});
	},

	/**
	 * @param {Function} next(err, table)
	 
	createTable : function(name, fields, ifNotExists, next)
	{
		var _next = createNextHandler(next),
			db = this,
			table, col;

		if (db.tables.hasOwnProperty(name) && !ifNotExists) {
			return _next(new SQLRuntimeError('Table "%s" already exists', name), null);
		}

		table = new Table(name, this);
		
		for (col = 0; col < fields.length; col++) {
			table.addColumn(fields[col]);
		}
		
		db.tables[name] = table;
		table.save(function(err) {
			if (err) {
				delete db.tables[name];
				return _next(err, null);
			}
			_next(null, table);
		});
	},*/

	/**
	 * Get a table by name from the database.
	 * @param {String} name - The name of the desired table
	 * @return {Table}
	 * @throws {SQLRuntimeError} error - If there is no such table
	 */
	getTable : function(tableName, throwError)
	{			
		var table = this.tables[tableName];
		if (!table) {
			if (throwError === false)
				return null;
			throw new SQLRuntimeError(
				'No such table "%s" in database "%s"',
				tableName,
				this.name
			);
		}
		return table;
	}
});


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
var Table = Persistable.extend({
	
	/**
	 * @constructor
	 */
	construct : function(tableName, db) 
	{
		Persistable.prototype.construct.call(this, "table");

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
		this.parent = this._db      = db;
		this.storage  = db.storage;
		this.bubbleTarget = db;
		this.children = this.rows;

		//Observer.call(this);
	},

	/*
	createIndex : function(options) 
	{
		var name;
		assertType(options, "Object", "Invalid argument for Table.createIndex");
		assertType(options.name, "String", "Invalid index name");
		name = trim(options.name);
		assert(name, "Index name is required");
		assert(!this.keys.hasOwnProperty(name), 'Index "%s" already exists');

		this.keys[name] = {
			index      : [],
			columns    : [],
			onConflict : null
		};
	},
	*/

	/*getPatch : function() 
	{
		var hasChanges = false, out = {}, rowID, row;

		if (this._isDirty) {
			hasChanges = true;
			out[this.getStorageKey()] = JSON.stringify(this.toJSON());
		}

		for ( rowID in this.rows) {
			row = this.rows[rowID];
			if (row._isDirty) {
				hasChanges = true;
				out[row.getStorageKey()] = JSON.stringify(row._data);
			}
		}

		return hasChanges ? out : null;
	},*/

	/**
	 * Generates and returns the JSON representation of the table object. This is 
	 * mostly used by the "save procedure".
	 * @todo The rows property might contain only the IDs instead of full keys
	 * @return {Object}
	 */
	toJSON : function() 
	{
		var json = {
			name    : this.name,
			columns : {},
			keys    : {},
			rows    : this._row_seq
		};
		for (var name in this.cols) {
			json.columns[name] = this.cols[name].toJSON();
		}
		//for ( name in this.rows) {
		//	//json.rows[name] = this.rows[name].toArray();
		//	json.rows[name] = this.rows[name].getStorageKey();
		//}
		for ( name in this.keys ) {
			json.keys[name] = this.keys[name].toJSON();
		}
		return json;
	},

	/**
	 * Overrides the Persistable.prototype.getStorageKey method. Generates and 
	 * returns the key to be used as storage key. The key represents the full path
	 * to the table expressed as "{namespace}.{database name}.{table name}".
	 * @return {String}
	 */
	getStorageKey : function() 
	{
		return [NS, this._db.name, this.name].join(".");
	},

	/**
	 * Add constraint to the table. This can be used if the columns are already
	 * known and created. Creates an index and updates the Column object(s) to refer
	 * to it...
	 */
	addConstraint : function(props)
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

			this._isDirty = true;
		}
	},

	addColumn : function(props)
	{//console.log("addColumn: ", props);
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
		this._isDirty = true;
		
		if (col.key) {
			// TODO: Add index
		}
		return col;
	},

	/**
	 * Overrides the Persistable.prototype.save method. Saves the table and when 
	 * done, also saves the database that this table belongs to.
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 * @emits savestart:table - Before the save procedure is started
	 * @emits save:table - If the save finishes successfully
	 */
	/*save : function(next) 
	{
		var table = this, _next = createNextHandler(next);
		table.emit("savestart:table", table);
		table._db.save(function(err) {
			if (err)
				return _next(err);
			table._isDirty = false;
			table.emit("save:table", table);
			_next(null, table);
		});
		return table;
	},*/

	_insertRow : function(data, key) 
	{
		var row = new TableRow(this, key);
		
		for (var i = 0; i < data.length; i++) {
			row._data[i] = this.cols[this._col_seq[i]].set(data[i]);
		}

		for (var ki in this.keys) {
			this.keys[ki].beforeInsert(row);
		}

		this._ai = Math.max(this._ai, key) + 1;
		this._length++;
		this._row_seq.push(key);
		this.rows[key] = row;
		this._isDirty = true;
	},

	load : function(next) 
	{
		var table = this, _next = createNextHandler(next);

		table.emit("loadstart:table", table);
		
		table.read(function(err, json) {
			
			if (err) 
				return _next(err);

			if (!json) {
				table.emit("load:table", table);
				return _next(null, table);
			}
			
			table.cols       = {};
			table.rows       = {};
			table.keys       = {};
			table._row_seq   = [];
			table._col_seq   = [];
			table._length    = 0;
			table._ai        = 1;
			table.primaryKey = null;
			
			// Create columns
			for ( var name in json.columns ) {
				table.addColumn(json.columns[name]);
			}

			// Create indexes
			if (json.keys) {
				table.keys       = {};
				table.primaryKey = null;
				for ( name in json.keys ) {
					table.keys[name] = TableIndex.fromJSON(json.keys[name], table);
				}
			}

			// Create rowsID list and fetch them together
			var rowIDs = [],
				prefix = table.getStorageKey(),
				len    = json.rows.length;
			for ( var key = 0; key < len; key++ ) {
				rowIDs.push(prefix + "." + json.rows[key]);
			}
			
			// Load rows data
			if (rowIDs.length) {
				table.storage.getMany(rowIDs, function(err, rows) {
					
					if (err) 
						return _next(err);
					
					each(rows, function(data, idx) {
						table._insertRow(data, json.rows[idx]);
					});

					table._isDirty = false;
					table.emit("load:table", table);
					_next(null, table);
				});
			} else {
				table._isDirty = false;
				table.emit("load:table", table);
				_next(null, table);
			}
		});
	},

	insert : function(keys, values, next) 
	{
		var table = this, 
			_next = createNextHandler(next),
			trx = new Transaction({ 
				name  : "Insert into table " + table.name,
				debug : table._db.server.options.debug,
				autoRollback : true
			}),
			kl = keys.length,
			rl = values.length;

		function createRowInserter(idx) {
			var insertID;
			trx.add(Transaction.createTask({
				name : "Insert row " + idx,
				//timeout : 10000,
				execute : function(next) {
					var row = new TableRow(table, table._ai),
						ki;

					try {
					
					// for each user-specified column
					for (ki = 0; ki < kl; ki++) {
						row.setCellValue(keys[ki], values[idx][ki]);
					}

					for (ki in table.keys) {
						table.keys[ki].beforeInsert(row);
					}

					insertID = table._ai++;
					table.rows[insertID] = row;
					table._length++;
					table._row_seq.push(insertID);
					table._isDirty = true;
					row._isDirty = true;
					
					//next(null, row);
					} catch (ex) {
						return next(ex);
					}
					
					row.save(next);
				},
				undo : function(next) {
					if (insertID)
						return table.rows[insertID].drop(next);
					next();
				}
			}));
		}

		trx.one("complete", function(e) {
			_next(null, table);
		});

		trx.one("rollback", function(e, err) {
			_next(err, null);
		});

		trx.add(Transaction.createTask({
			name : "insert",
			execute : function(next) {
				for (var i = 0; i < rl; i++) {
					createRowInserter(i);
				}
				//trx.add(Transaction.createTask({
				//	name : "Save table after inserts",
				//	execute : function(next) {
				//		table.save(next);
				//	}
				//}));
				next();
			},
			undo : function(next) {
				next();
			}
		}));

		

		trx.start();
	},

	/**
	 * Updates table row(s)
	 */
	update : function(map, alt, where, onSuccess, onError)
	{
		// The UPDATE can be canceled if a "beforeupdate:table" listener returns false 
		if (!this.emit("beforeupdate:table", this)) {
			return onError(null, strf(
				'The UPDATE procedure of table "%s" was canceled by a ' + 
				'"beforeupdate:table" event listener',
				this.getStorageKey()
			));
		}
		
		var table = this, 
			trx = new Transaction({
				name         : "Update " + table.name + " transaction",
				autoRollback : false,
				onError      : handleConflict,
				onComplete   : function() {
					table.save(function(err) {
						if (err)
							return onError(err);
						table.emit("update:table", table);
						onSuccess();
					});
				}
			}),
			conflictHandled = false;

		// ROLLBACK|ABORT|REPLACE|FAIL|IGNORE
		function handleConflict(error)
		{
			if (conflictHandled)
				return true;

			// This function might be called more than once because of transaction 
			// timeout errors, so make sure that those will not result in multiple 
			// callback invokations!
			conflictHandled = true;
			
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

		function createRowUpdater(row, newRow) 
		{
			var rowBackUp = row.toJSON("object"), task = Transaction.createTask({
				name : "Update row " + row.getStorageKey(),
				execute : function(next)
				{
					var name;

					try {

						// Create the updated version of the row
						for ( name in map )
						{
							newRow[name] = executeCondition(map[name], newRow);
						}

						// The UPDATE can be canceled on row level if a 
						// "beforeupdate:row" listener returns false 
						if (!row.emit("beforeupdate:row", row))
						{
							return next(null);
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

						//table._isDirty = true;
						row.emit("update:row", row);

						next(null);

					} catch (ex) {
						next(ex);
					}
				},
				undo : function(done)
				{
					for ( var name in rowBackUp )
						row.setCellValue( name, rowBackUp[name] );
					//table._isDirty = false;
					done();
				}
			});

			trx.add(task);
		}

		each(table.rows, function(row, id) {
			var newRow = row.toJSON("object"), name;

			// Skip rows that don't match the WHERE condition if any
			if (where && !executeCondition( where, newRow ))
				return true;

			createRowUpdater(row, newRow);
		});
		
		trx.start();
	},















	/**
	 * Deletes the table
	 * @param {Function} next(err, table)
	 * @return {void}
	 */
	drop : function(next) 
	{
		var table     = this, 
			keyPrefix = table.getStorageKey(),
			rowIds    = [],
			_next     = createNextHandler(next),
			id;

		if (!table.emit("before_delete:table", table))
			return _next(strf('"%s" event  canceled', "before_delete:table"), table);
			
		for ( id in table.rows )
			rowIds.push(keyPrefix + "." + id);
		
		// Delete all the rows
		table.storage.unsetMany(rowIds, function(err) {
			if (err) 
				return _next(err, table);
			
			// Delete the table
			Persistable.prototype.drop.call(table, function(err) {
				if (err)
					return _next(err, table);

				// Update the database
				delete table._db.tables[table.name];
				table._db.save(function(err) {
					if (err)
						return _next(err, table);

					table.emit("after_delete:table", table);
					_next(null, table);
				});
			});
		});
	},

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
	getRows : function(filter)
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
	},*/

	/**
	 * Deletes rows from the table.
	 * @param {String} what - What to delete. Can be:
	 * <ul>
	 *   <li>String   - The key of single row that should be deleted</li>
	 *   <li>Number   - The index of the row to delete</li>
	 *   <li>TableRow - The row to be deleted</li>
	 *   <li>Array    - Array of row keys to delete multiple rows</li>
	 * </ul>
	 * @param {Function} next(err) Optional
	 * @return {void}
	 */
	deleteRows : function(rows, next)
	{
		var table = this,
			keys  = [],
			_next = createNextHandler(next);
		
		rows = makeArray(rows);

		each(rows, function(row) {
			keys.push(row.getStorageKey());
		});

		// Delete row from the storage
		table.storage.unsetMany(keys, function(err) {

			if (err)
				return _next(err);
			
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
			table._isDirty = true;
			table.save(function(err) {
				_next(err);
			});
		});
	}
});


// -----------------------------------------------------------------------------
// Starts file "src/Column.js"
// -----------------------------------------------------------------------------
var re_date     = "(\\d{4})\\s*-\\s*(\\d{1,2})\\s*-\\s*(\\d{1,2})";
var re_time     = "(\\d{1,3})\\s*:\\s*(\\d{1,2})\\s*:\\s*(\\d{1,2})";
var re_datetime = re_date + "\\s+" + re_time;

var RE_DATE      = new RegExp("^\\s*" + re_date     + "\\s*$");
var RE_TIME      = new RegExp("^\\s*" + re_time     + "\\s*$");
var RE_DATETIME  = new RegExp("^\\s*" + re_datetime + "\\s*$");
var RE_TIMESTAMP = new RegExp("^\\s*({\\d{6}|\\d{8}|\\d{12}|\\d{14})\\s*$");



/**
 * @classdesc Represents a column which is an abstract object resposible for 
 * handling the datatype constraints
 * @constructor
 */
var Column = Class.extend({ 
	
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
	},

	get : function(value) 
	{
		return value;
	},

	construct : function() {
		/**
		 * The arguments for the data type. If the column type support some 
		 * arguments they will be stored here.
		 * @type {Array}
		 */
		this.typeParams = [];
	}
}, {

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
	create : function(options)
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
	}
});







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
var NumericColumn = Column.extend({
	constructor   : NumericColumn,
	unsigned      : false,
	zerofill      : false,
	autoIncrement : false,
	minUnsigned   :  0,
	minSigned     : -1,
	maxUnsigned   :  2,
	maxSigned     :  1,
	max           :  1,
	min           : -1,

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
	init : function(options) 
	{
		this.setUnsigned(options.unsigned);
		
		if ( isArray(options.type.params) && options.type.params.length > 0 ) {
			this.setLength(options.type.params[0]);
			this.typeParams = [this.length];
		}
		
		this.setAutoIncrement(options.autoIncrement);
		this.zerofill = !!options.zerofill;
		Column.prototype.init.call(this, options);
	},

	setAutoIncrement : function(bOn)
	{
		this.autoIncrement = !!bOn;
	},

	setUnsigned : function(bUnsigned)
	{
		this.unsigned = !!bUnsigned;
		this.min = this.unsigned ? this.minUnsigned : this.minSigned;
		this.max = this.unsigned ? this.maxUnsigned : this.maxSigned; 
	},

	setLength : function(n) 
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
	},

	toJSON : function() {
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
	},

	toSQL : function() 
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
	}
});

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
var Column_BIT = NumericColumn.extend({
	type : "BIT",

	init : function(options) 
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
	},

	setLength : function(n) 
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
	},

	set : function(value) {
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
	}
});

// Column_INT extends NumericColumn
// =============================================================================
/**
 * @classdesc Class Column_INT extends NumericColumn
 * @constructor
 * @extends {NumericColumn}
 */
var Column_INT = NumericColumn.extend({
	type        : "INT",
	minUnsigned :  0,
	minSigned   : -2147483648,
	maxUnsigned :  4294967295,
	maxSigned   : 2147483647,

	init : function(options) 
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
	},

	setLength : function(n) 
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
	},

	set : function(value) 
	{
		if (value === null) {
			if (this.nullable || this.autoIncrement)
				return value;

			throw new SQLRuntimeError('Column "%s" cannot be NULL.', this.name);
		}

		var n = parseInt(value, 10);
		
		if (isNaN(n) || !isFinite(n) || n < this.min || n > this.max) {
			throw new SQLRuntimeError(
				'Invalid value "%s" for column "%s". ' + 
				'Expecting an integer between %s and %s.',
				String(value),
				this.name,
				this.min,
				this.max
			);
		}
		
		return n;
	}
});


// Column_INTEGER - alias of Column_INT
// =============================================================================
/**
 * @classdesc Class Column_INTEGER extends Column_INT. This is an alias of
 * Column_INT. The only difference is that the "type" property is set to 
 * "INTEGER" instead of "INT".
 * @constructor
 * @extends {Column_INT}
 */
var Column_INTEGER = Column_INT.extend({
	type : "INTEGER"
});


// Column_TINYINT extends Column_INT
// =============================================================================
/**
 * @classdesc Class Column_TINYINT extends Column_INT
 * @constructor
 * @extends {Column_INT}
 */
var Column_TINYINT = Column_INT.extend({
	type        : "TINYINT",
	minUnsigned :  0,
	minSigned   : -128,
	maxUnsigned :  255,
	maxSigned   :  127
});

// Column_SMALLINT extends Column_INT
// =============================================================================
/**
 * @classdesc Class Column_SMALLINT extends Column_INT
 * @constructor
 * @extends {Column_INT}
 */
var Column_SMALLINT = Column_INT.extend({
	type        : "SMALLINT",
	minUnsigned :  0,
	minSigned   : -32768,
	maxUnsigned :  65535,
	maxSigned   :  32767
});


// Column_MEDIUMINT extends Column_INT
// =============================================================================
/**
 * @classdesc Class Column_MEDIUMINT extends Column_INT
 * @constructor
 * @extends {Column_INT}
 */
var Column_MEDIUMINT = Column_INT.extend({
	type        : "MEDIUMINT",
	minUnsigned :  0,
	minSigned   : -8388608,
	maxUnsigned :  16777215,
	maxSigned   :  8388607
});


// Column_BIGINT extends Column_INT
// =============================================================================
/**
 * @classdesc Class Column_BIGINT extends Column_INT
 * @constructor
 * @extends {Column_INT}
 */
var Column_BIGINT = Column_INT.extend({
	type        : "BIGINT",
	minUnsigned :  0,
	minSigned   : -9223372036854775808,
	maxUnsigned :  18446744073709551615,
	maxSigned   :  9223372036854775807
});


// Column_DECIMAL extends NumericColumn
// =============================================================================
var Column_DECIMAL = NumericColumn.extend({
	type        : "DECIMAL",
	length      : 10,
	decimals    : 0,
	minUnsigned : Column_INT.prototype.minUnsigned,
	minSigned   : Column_INT.prototype.minSigned,
	maxUnsigned : Column_INT.prototype.maxUnsigned,
	maxSigned   : Column_INT.prototype.maxSigned,
	min         : Column_INT.prototype.minUnsigned,
	max         : Column_INT.prototype.maxUnsigned,

	init : function(options) 
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
	},

	set : function(value) 
	{
		var n = parseFloat(value);
		
		if (isNaN(n) || !isFinite(n) || n < this.min || n > this.max) {
			throw new SQLRuntimeError(
				'Invalid value "%s" for column "%s". ' + 
				'Expecting a number between %s and %s.',
				String(value),
				this.name,
				this.min,
				this.max
			);
		}
		//debugger;
		n = Number(value).toPrecision(this.length);
		
		return Number(n).toFixed(this.decimals);
	}
});


// Column_NUMERIC - alias of Column_DECIMAL
// =============================================================================
var Column_NUMERIC = Column_DECIMAL.extend({
	type : "NUMERIC"
});


// Column_DOUBLE extends NumericColumn
// =============================================================================
var Column_DOUBLE = NumericColumn.extend({
	type        : "DOUBLE",
	length      : 10,
	decimals    : 2,
	minUnsigned : Column_INT.prototype.minUnsigned,
	minSigned   : Column_INT.prototype.minSigned,
	maxUnsigned : Column_INT.prototype.maxUnsigned,
	maxSigned   : Column_INT.prototype.maxSigned,

	init : function(options) 
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
	},

	set : function(value) 
	{
		var n = parseFloat(value);
		
		if (isNaN(n) || !isFinite(n) || n < this.min || n > this.max) {
			throw new SQLRuntimeError(
				'Invalid value "%s" for column "%s". ' + 
				'Expecting a number between %s and %s.',
				String(value),
				this.name,
				this.min,
				this.max
			);
		}
		
		n = Number(value).toPrecision(this.length);
		
		var q = Math.pow(10, this.decimals);
	    return Math.round(n * q) / q;
	}
});

// Column_FLOAT extends NumericColumn
// =============================================================================
var Column_FLOAT = NumericColumn.extend({
	type        : "FLOAT",
	length      : 10,
	decimals    : 2,
	minUnsigned : Column_INT.prototype.minUnsigned,
	minSigned   : Column_INT.prototype.minSigned,
	maxUnsigned : Column_INT.prototype.maxUnsigned,
	maxSigned   : Column_INT.prototype.maxSigned,

	init : function(options) 
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
	},

	set : function(value) 
	{
		var n = parseFloat(value);
		
		if (isNaN(n) || !isFinite(n) || n < this.min || n > this.max) {
			throw new SQLRuntimeError(
				'Invalid value "%s" for column "%s". ' + 
				'Expecting a number between %s and %s.',
				String(value),
				this.name,
				this.min,
				this.max
			);
		}
		
		n = Number(value).toPrecision(this.length);
		
		var q = Math.pow(10, this.decimals);
	    return Math.round(n * q) / q;
	}
});

// StringColumn extends Column
// =============================================================================
var StringColumn = Column.extend({
	type        : "STRING",
	length      : -1,
	maxLength   : Number.MAX_VALUE,

	init : function(options) 
	{
		if ( isArray(options.type.params) && 
			options.type.params.length > 0 &&
			String(options.type.params[0]) != "-1" ) 
		{
			this.setLength(options.type.params[0]);
			this.typeParams = [this.length];	
		}
		Column.prototype.init.call(this, options);
	},

	setLength : function(n) 
	{
		n = parseInt(n, 10);
		if (isNaN(n) || !isFinite(n) || n < 0 ) {
			throw new SQLRuntimeError(
				'Invalid length for column "%s". The length must be a positive integer.',
				this.name
			);
		}
		this.length = Math.min(n, this.maxLength);
	},

	set : function(value) 
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
	},

	toSQL : function() 
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
	}
});



// Column_VARCHAR extends StringColumn
// =============================================================================
var Column_VARCHAR = StringColumn.extend({
	type        : "VARCHAR",
	length      : -1,
	maxLength   : 65535
});

// Column_CHAR extends StringColumn
// =============================================================================
var Column_CHAR = StringColumn.extend({
	type        : "CHAR",
	length      : -1,
	maxLength   : 65535
});

// Column_ENUM extends StringColumn
// =============================================================================
/**
 * @constructor
 * @extends {StringColumn}
 */
var Column_ENUM = StringColumn.extend({
	type : "ENUM",
	
	setLength : function(n) {},

	/**
	 * The initialization of ENUM columns requires at least one option to be 
	 * specified in the options.type.params array.
	 */
	init : function(options) 
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
	},

	/**
	 * Setting a value on ENUM column requires that that value is present in the
	 * options list. Otherwise an exception is thrown.
	 * @param {String|Number} value - The value to set
	 * @return {String} - The value that has been set as string
	 * @throws {SQLRuntimeError} exception - If the value is invalid
	 */
	set : function(value) 
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
	},

	/**
	 * Overrides the basic typeToSQL method so that the ENUM columns include their
	 * options as comma-separated list in brackets after the type name.
	 * @return {String} - The SQL representation of the column
	 */
	typeToSQL : function() {
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
	}
});

var DateTimeColumn = Column.extend({
	//get : function() {
	//	throw new Error("Please implement get()");
	//},

	set : function(d) 
	{
		if (d === null) {
			if (this.nullable || this.autoIncrement)
				return d;

			throw new SQLRuntimeError('Column "%s" cannot be NULL.', this.name);
		}

		var _d = parseDate(d);
		if (isNaN(_d * 1)) {
			throw new SQLParseError(
				'Invalid value "%s" for column "%s".',
				d + " (" + typeof d + ")",
				this.name
			);
		}

		return _d.getTime();//this.get(_d);
	}
});

// Column_DATE extends DateTimeColumn
// =============================================================================
var Column_DATE = DateTimeColumn.extend({
	type : "DATE",

	/**
	 * jsSQL displays DATE values in 'YYYY-MM-DD' format, but allows you to 
	 * assign values to DATE columns using either strings, numbers or Date 
	 * objects.
	 */
	get : function(d) 
	{
		return d === null ? "0000-00-00" : strftime("%Y-%m-%d", d);
	},
});

// Column_YEAR extends DateTimeColumn
// =============================================================================
var Column_YEAR = DateTimeColumn.extend({
	type : "YEAR",

	/**
	 * jsSQL displays YEAR values in 'YYYY' format, but allows you to 
	 * assign values to DATE columns using either strings, numbers or Date 
	 * objects.
	 */
	get : function(d) 
	{
		return d === null ? "0000" : strftime("%Y", d);
	},
});

// Column_DATETIME extends DateTimeColumn
// =============================================================================
var Column_DATETIME = DateTimeColumn.extend({
	type : "DATETIME",

	format : "%Y-%m-%d %H:%M:%S",

	init : function(options) 
	{
		if ( isArray(options.type.params) && options.type.params.length > 0 ) {
			var first = options.type.params[0];
			if (isNumeric(first)) {
				this.fps = intVal(first);
			} else {
				this.format = first;
			}
			this.typeParams = [this.length];
		}
		//console.log(this);
		Column.prototype.init.call(this, options);
	},

	/**
	 * jsSQL displays DATETIME values in 'YYYY-MM-DD HH:MM:SS' format, but 
	 * allows you to assign values to DATE columns using either strings, numbers
	 * or Date objects.
	 */
	get : function(d) 
	{
		return d === null ? 
			"0000-00-00 00:00:00" : 
			strftime(this.format, d);
	}
});

// Column_TIME extends DateTimeColumn
// =============================================================================
var Column_TIME = DateTimeColumn.extend({
	type : "TIME",

	/**
	 * jsSQL displays TIME values in 'HH:MM:SS' format, but allows you to assign
	 * values to DATE columns using either strings, numbers or Date objects.
	 */
	get : function(d) 
	{
		return d === null ? "00:00:00" : strftime("%H:%M:%S", d);
	},
});

// Column_TIMESTAMP extends DateTimeColumn
// =============================================================================
var Column_TIMESTAMP = DateTimeColumn.extend({
	type : "TIMESTAMP",

	init : function(options) 
	{
		if ( isArray(options.type.params) && options.type.params.length > 0 ) {
			this.setLength(options.type.params[0]);
			this.typeParams = [this.length];
		} else {
			this.setLength(14);
		}
		Column.prototype.init.call(this, options);
	},

	setLength : function(n) 
	{
		var accept = { 4: 1, 6: 1, 8: 1, 10: 1, 12: 1, 14: 1 };
		n = parseInt(n, 10);
		if (isNaN(n) || !isFinite(n) || !(n in accept)) {
			throw new SQLRuntimeError(
				'Invalid length for column "%s". The length (if specified) ' + 
				'must be %s.',
				this.name,
				prettyList(accept)
			);
		}
		this.length = n;
	},

	set : function(d) 
	{
		//if (d === null) {
		//	if (this.nullable || this.autoIncrement)
		//		return d;
		//
		//	throw new SQLRuntimeError('Column "%s" cannot be NULL.', this.name);
		//}
		if (d === null) 
			d = "now";

		var _d = parseDate(d);
		if (isNaN(_d * 1)) {
			throw new SQLParseError(
				'Invalid value "%s" for column "%s".',
				d + " (" + typeof d + ")",
				this.name
			);
		}

		return _d.getTime();//this.get(_d);
	},

	/**
	 * TIMESTAMP[(M)]
	 *
	 * A timestamp. The range is '1970-01-01 00:00:00' to sometime in the year 
	 * 2037. jsSQL displays TIMESTAMP values in YYYYMMDDHHMMSS, YYMMDDHHMMSS, 
	 * YYYYMMDD, or YYMMDD format, depending on whether M is 14 (or missing), 
	 * 12, 8, or 6, but allows you to assign values to TIMESTAMP columns using 
	 * either strings, numbers or Date objects.
	 */
	get : function(d) 
	{
		if (d === null) 
			return d;

		var _d = new Date(d);

		var out = [ _d.getFullYear() ];

		if (this.length > 4)
			out.push(prependZero(_d.getMonth() + 1, 2));

		if (this.length > 6)
			out.push(prependZero(_d.getDate(), 2));

		if (this.length > 8) 
			out.push(prependZero(_d.getHours(), 2));

		if (this.length > 10) 
			out.push(prependZero(_d.getMinutes(), 2));

		if (this.length > 12) 
			out.push(prependZero(_d.getSeconds(), 2));

		return out.join("");
	}
});

/**
 * A map the supported SQL data types and the corresponding constructor function
 * that should create an instance of the given column type.
 * @type {Object}
 * @static
 * @readonly
 */
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
	
	"DATE"      : Column_DATE     ,
	"TIME"      : Column_TIME     , // [(fsp)]
	"TIMESTAMP" : Column_TIMESTAMP, // [(fsp)]
	"DATETIME"  : Column_DATETIME , // [(fsp)]
	"YEAR"      : Column_YEAR     ,
	
	"CHAR"      : Column_CHAR     , // [(length)] [CHARACTER SET charset_name] [COLLATE collation_name]
	"VARCHAR"   : Column_VARCHAR  , // (length) [CHARACTER SET charset_name] [COLLATE collation_name]
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
	"ENUM" : Column_ENUM          , // (value1,value2,value3,...)[CHARACTER SET charset_name] [COLLATE collation_name]
	//"SET" : {}//, // (value1,value2,value3,...)[CHARACTER SET charset_name] [COLLATE collation_name]
	//"spatial_type"
};


// -----------------------------------------------------------------------------
// Starts file "src/TableRow.js"
// -----------------------------------------------------------------------------

var TableRow = Persistable.extend({

	/**
	 * Represents a table row which is a managed collection of TableCell objects.
	 * @param {Table} table (optional; can be set later too)
	 * @constructor
	 * @return {TableRow}
	 * @extends Persistable
	 */
	construct : function(table, id) {
		
		Persistable.prototype.construct.call(this, "row", table);

		/**
		 * The id of the row is just it's sequence number provided by the 
		 * contaning Table instance.
		 * @type Number
		 * @readonly
		 */
		this.id = id;

		/**
		 * The Table of this row
		 * @type Table
		 */
		this.table = table;

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

		this.setTable(table);
	},


	/**
	 * Overrides the Persistable.prototype.getStorageKey method. Generates and 
	 * returns the key to be used as storage key.
	 * @return {String}
	 */
	getStorageKey : function()
	{
		return [
			NS, 
			this.table._db.name, 
			this.table.name,
			this.id
		].join(".");
	},

	/**
	 * Loads the row data from the storage.
	 * @emits loadstart:row - before the loading starts
	 * @emits load:row - If the load was successfully completed
	 * @return {void} This method is async. Use the callback instead of relying on 
	 * 		return value.
	 * @param {Function} next(err, row) - The callback to be invoked after the 
	 * 		loading is complete (successful or not). Optional.
	 */
	load : function(next)
	{
		var row   = this, 
			_next = createNextHandler(next);
		
		row.emit("loadstart:row", row);
		
		row.read(function(err, json) {
			if (err)
				return _next(err, null);

			if (json && json.length) {
				for (var i = 0; i < row.length; i++) {
					row._data[i] = row.table.cols[row.table._col_seq[i]].set(
						json[i]
					);
				}
			}

			row._isDirty = false;
			row.emit("load:row", row);
			_next(null, row);
		});
	},

	/**
	 * Injects the Table reference and then recreates the entire state of the 
	 * instance by analyzing the table columns.
	 * @param {Table} table
	 * @return {TableRow}
	 */
	setTable : function(table)
	{
		var colName, col;

		this.length = 0;
		this._cellsByName = {};
		this.parent = this.table = table;
		this._data = [];
		this.storage = table.storage;
		this.bubbleTarget = table;

		for (colName in table.cols) 
		{
			col = table.cols[colName];
			this._cellsByName[colName] = this.length;

			if (col.defaultValue !== undefined) {
				this.setCellValue(this.length, col.defaultValue);
			}
			else if (col.nullable) {
				this.setCellValue(this.length, null);
			}
			this.length++;
			//this.setCellValue(
			//	this.length++, 
			//	col.defaultValue === undefined ? null : col.defaultValue
			//);
		}
		
		this._isDirty = false;

		return this;
	},

	/**
	 * Returns a reference to one of the TableCells in the row by name.
	 * @throws Error if the cell does not exist
	 * @return {TableCell}
	 */
	getCell : function(name)
	{
		assertInObject(name, this._cellsByName, 'No such field "' + name + '".');
		return this.table.cols[name].get(this._data[this._cellsByName[name]]);
		//return this._data[this._cellsByName[name]];
	},

	/**
	 * Returns a reference to one of the TableCells in the row by it's index.
	 * @throws RangeError if the cell does not exist
	 * @return {TableCell}
	 */
	getCellAt : function(index)
	{
		assertInBounds(index, this._data, 'No field at index "' + index + '".');
		return this.table.cols[this.table._col_seq[index]].get(this._data[index]);
		//return this._data[index];
	},

	/**
	 * Sets the value of the cell specified by name or by index.
	 * @param {String|Number} nameOrIndex The name or the index of the cell.
	 * @value {String|Number} value
	 * @throws Error if the cell does not exist
	 * @return {TableRow} Returns the instance
	 */
	setCellValue : function(nameOrIndex, value)
	{
		var _isNumeric = isNumeric(nameOrIndex),
			col = _isNumeric ? 
				this.table.cols[this.table._col_seq[nameOrIndex]] :
				this.table.cols[nameOrIndex],
			oldVal = _isNumeric ? 
				this._data[nameOrIndex] :
				this._data[this._cellsByName[nameOrIndex]],
			newVal;

		if (value === oldVal)
			return this;

		newVal = col.set(value);

		if (newVal === oldVal)
			return this;

		if (newVal === null && col.autoIncrement)
			newVal = this.table._ai;

		this._data[_isNumeric ? 
			nameOrIndex : 
			this._cellsByName[nameOrIndex]] = newVal;

		if (newVal !== oldVal)
			this._isDirty = true; // TODO: notify change if needed
		
		return this;
	},

	/**
	 * Gets the value of the cell specified by name or by index.
	 * @param {String|Number} nameOrIndex The name or the index of the cell.
	 * @throws Error if the cell does not exist
	 * @return {any} Returns the cell value
	 */
	getCellValue : function(nameOrIndex)
	{
		return isNumeric(nameOrIndex) ? 
			this.getCellAt(nameOrIndex) : 
			this.getCell(nameOrIndex);
	},

	/**
	 * Creates and returns the plain object representation of the instance.
	 * @param {String} format Optional. Can be "array", "object" or "mixed".
	 * Defaults to "mixed".
	 * @return {Object}
	 */
	toJSON : function(format) 
	{
		if (!format || format == "array")
			return this._data.slice();

		var json = {}, k;

		if (format == "object" || format == "mixed") {
			for (k in this._cellsByName) {
				json[k] = this.getCell(k);
			}
		}
		
		if (format == "mixed") {
			for ( k = 0; k < this.length; k++ ) {
				json[k] = this.getCellAt(k);
			}	
		}

		return json;
	}
});



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
		assertType(cols, "Array");
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
		assertType(name, "String", "The name of the index must be a string");
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
// Starts file "src/export.js"
// -----------------------------------------------------------------------------
GLOBAL[NS] = JSDB;
GLOBAL.jsSQL = jsSQL;

//JSDB.query  = query;
JSDB.Result = Result;
//JSDB.query2 = query2;

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

		tokenize           : tokenize,
		getTokens          : getTokens,
		getQueries         : getQueries,
		normalizeQueryList : normalizeQueryList,
		Walker             : Walker,
		//parse            : parse,
		Table              : Table,
		TableIndex         : TableIndex,
		//SERVER             : SERVER,
		Column             : Column,
		TableRow           : TableRow,
		//TableCell        : TableCell,
		binarySearch       : binarySearch,
		//BinaryTree       : BinaryTree,
		//BinaryTreeNode   : BinaryTreeNode,
		crossJoin          : crossJoin,
		innerJoin          : innerJoin,
		crossJoin2         : crossJoin2,
		executeCondition   : executeCondition,
		Transaction        : Transaction,
		//Storage            : Storage,
		//LocalStorage       : LocalStorage,

		SQLConstraintError : SQLConstraintError,
		SQLRuntimeError    : SQLRuntimeError,
		SQLParseError      : SQLParseError,

		parseDate    : parseDate,
		strftime     : strftime,
		parseISO8601 : parseISO8601,
		prependZero  : prependZero

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
					(v === undefined ? '' : v === null ? 'NULL' : String(v)), 
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



jsSQL.version = '0.1.182';
})(window);
