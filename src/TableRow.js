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
 * @param {Function} next(err, row) - The callback to be invoked after the 
 * 		loading is complete (successful or not). Optional.
 */
TableRow.prototype.load = function(next)
{
	var row   = this, 
		_next = createNextHandler(next);
	
	events.dispatch("loadstart:row", row);
	
	row.read(function(err, json) {
		if (err)
			return _next(err, null);

		if (json) {
			for (var i = 0; i < row.length; i++) {
				row._data[i] = row.table.cols[row.table._col_seq[i]].set(json[i]);
			}
		}

		JSDB.events.dispatch("load:row", row);
		
		_next(null, row);
	});
};

/**
 * Saves the row data to the storage.
 * @emits savestart:row - before the saving starts
 * @emits save:row - If the save was successfully completed
 * @return {void} This method is async. Use the callback instead of relying on 
 * 		return value.
 * @param {Function} next(err, row) - The callback to be invoked after the 
 * 		saving is complete (successful or not). Optional.
 */
TableRow.prototype.save = function(next)
{
	var row = this, _next = createNextHandler(next);

	events.dispatch("savestart:row", row);

	row.write( this._data, function(err) {
		if (err) 
			return _next(err, null);
		
		events.dispatch("save:row", row);
		
		_next(null, row);
	});
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
