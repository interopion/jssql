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
