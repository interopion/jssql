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


