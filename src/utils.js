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
