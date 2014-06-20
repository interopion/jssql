/**
 * Represents a table row which is a managed collection of TableCell objects.
 * @param {Table} table (optional; can be set later too)
 * @constructor
 * @return {TableRow}
 */
function TableRow(table, id)
{
	/**
	 * The id of the row is just it's sequence number provided by the contaning
	 * Table instance.
	 * @var Number
	 */
	this.id = id;

	/**
	 * The Table of this row
	 * @var Table
	 */
	this.table = null;

	/**
	 * The length of the row, i.e. the number of the cells inside it.
	 * IMPORTANT: Must me treated as read-only
	 * @var Number
	 */
	this.length = 0;

	/**
	 * The collection of TableCell objects
	 * @var Array
	 * @private
	 */
	this._cells = [];
	
	/**
	 * The collection of TableCell objects by name
	 * @var Object
	 * @private
	 */
	this._cellsByName = {};

	if (table) {
		this.setTable(table);
	}
}

TableRow.prototype = new Persistable();
TableRow.prototype.constructor = TableRow;

TableRow.prototype.getStorageKey = function()
{
	return [
		NS, 
		this.table._db.name, 
		this.table.name,
		this.id
	].join(".");
};

TableRow.prototype.load = function(onSuccess, onError)
{
	var row = this;
	JSDB.events.dispatch("loadstart:row", row);
	this.read(function(json) {
		for (var i = 0; i < row.length; i++) {
			row._cells[i].setValue(json[i]);
		}
		JSDB.events.dispatch("load:row", row);
		onSuccess(row);
	}, onError);
};

TableRow.prototype.save = function(onSuccess, onError)
{
	var row = this;
	JSDB.events.dispatch("before_save:row", row);
	row.write( this.toArray(), function() {
		JSDB.events.dispatch("after_save:row", row);
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
	var colName, col, cell;

	assertInstance(table, Table);
	
	this.length = 0;
	this._cellsByName = {};
	this.table = table;

	for (colName in table.cols) {
		col  = table.cols[colName];
		cell = new TableCell(col);
		this.length = this._cells.push(cell);
		this._cellsByName[colName] = cell;
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
	return this._cellsByName[name];
};

/**
 * Returns a reference to one of the TableCells in the row by it's index.
 * @throws RangeError if the cell does not exist
 * @return {TableCell}
 */
TableRow.prototype.getCellAt = function(index)
{
	assertInBounds(index, this._cells, 'No field at index "' + index + '".');
	return this._cells[index];
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
	var cell = isNumeric(nameOrIndex) ? 
		this.getCellAt(nameOrIndex) : 
		this.getCell(nameOrIndex);

	cell.setValue(value);
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
		this.getCellAt(nameOrIndex).value : 
		this.getCell(nameOrIndex).value;
};

/**
 * Creates and returns the array representation of the instance.
 * @return {Array}
 */
TableRow.prototype.toArray = function() 
{
	var out = [], i;
	for (i = 0; i < this.length; i++) {
		out[i] = this._cells[i].value;
	}
	return out;
};

/**
 * Creates and returns the plain object representation of the instance.
 * @return {Object}
 */
TableRow.prototype.toJSON = function() 
{
	var json = {};
	for (var x in this._cellsByName) {
		json[x] = this._cellsByName[x].value;
	}
	return json;
};
