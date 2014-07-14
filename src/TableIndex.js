
/**
 * The standard index type is "INDEX".
 * @var Number
 */
TableIndex.TYPE_INDEX = 2;

/**
 * The "UNIQUE" index works like the standard index but also 
 * checks for duplicated values before insert and update and
 * throws exceptions if such are found.
 * @var Number
 */
TableIndex.TYPE_UNIQUE = 4;

/**
 * The "PRIMARY" index is an unique key but it also ensures that there is only
 * one PRIMARY KEY per table
 * @var Number
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
	this.columns = [];
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
	beforeUpdate : function(row) 
	{
		// TODO
	},

	/**
	 * Deletes the corresponding entry from the index. The table calls 
	 * this before DELETE.
	 * @param {TableRow} row The row that is about to be deleted
	 * @return void
	 */
	beforeDelete : function(row) 
	{
		// TODO
	},

	/**
	 * Sets the columns of the index. Note that this method assumes that the 
	 * columns do exist in the table.
	 * @param {Array} cols
	 * @throws {TypeError} if the argument is not an array
	 */
	setColumns : function(cols)
	{
		assertType(cols, "array");
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
		assertType(name, "string", "The name of the index must be a string");
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

