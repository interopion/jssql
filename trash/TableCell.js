/**
 * Represents a single table cell. Holds a references to the corresponding
 * Column object from the table that contains the cell.
 * @param {Column} column The column of the field
 * @param {String|Number} value (Optional) initial value. Defaults to the 
 *     for the column (which in turn defaults to undefined)
 * @constructor
 * @return {TableCell}
 */
function TableCell(column, row, value) 
{
	/**
	 * Refers to the TableRow instance that this cell belongs to
	 * @type {TableRow}
	 */
	this.row = row;

	this.setColumn(column);
	
	if (value !== undefined) {
		this.setValue(value);
	} else {
		this.setValue(
			this.column.defaultValue === undefined ?
				null : 
				this.column.defaultValue
		);
	}
}

TableCell.prototype = {

	/**
	 * The value of the cell.
	 * @type {any} Initially null
	 */
	value : null,

	/**
	 * Sets the Column instance that should correspond to this cell
	 * @param {Column}
	 * @return {TableCell} Returns the instance
	 */
	setColumn : function(column)
	{
		assertInstance(column, Column);
		this.column = column;
		return this;
	},

	/**
	 * Sets the underlying value by passing it to the Column object for
	 * validation first.
	 * @param {String|Number} value
	 * @return {TableCell} Returns the instance
	 */
	setValue : function(value)
	{
		this.value = this.column.set(value);
		if (this.value === null && this.column.autoIncrement) {
			this.value = this.row.table._ai;
		}
		return this;
	},

	/**
	 * This is useful for low level JS tasks. It will allow two fields to be
	 * compared using < or > operators for example. Also, an array of such
	 * objects can be sorted without passing a function to the sort method of
	 * the array...
	 * @return {String|Number|null}
	 */
	valueOf : function()
	{
		return this.value;
	}
};