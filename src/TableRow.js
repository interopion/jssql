
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

