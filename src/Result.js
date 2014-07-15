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
function Result()
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

		// String (just a result message)
		else if ( typeof data == "string" )
		{
			this.data = data || "";
			this.cols = [];
			this.rows = [];
			this.type = Result.TYPE_MESSAGE;
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
			throw new TypeError("Invalid argument");
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


