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

/**
 * @constructor
 */
function Table(tableName, db) 
{
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
	this._db      = db;
}

Table.prototype = new Persistable();
Table.prototype.constructor = Table;

Table.prototype.createIndex = function(options) 
{
	var name;
	assertType(options, "object", "Invalid argument for Table.createIndex");
	assertType(options.name, "string", "Invalid index name");
	name = trim(options.name);
	assert(name, "Index name is required");
	assert(!this.keys.hasOwnProperty(name), 'Index "%s" already exists');

	this.keys[name] = {
		index      : [],
		columns    : [],
		onConflict : null
	};
};

Table.prototype.toJSON = function() 
{
	var json = {
		name    : this.name,
		columns : {},
		rows    : {},
		keys    : {}
	};
	for (var name in this.cols) {
		json.columns[name] = this.cols[name].toJSON();
	}
	for ( name in this.rows) {
		//json.rows[name] = this.rows[name].toArray();
		json.rows[name] = this.rows[name].getStorageKey();
	}
	for ( name in this.keys ) {
		json.keys[name] = this.keys[name].toJSON();
	}
	return json;
};

/**
 * Overrides the Persistable.prototype.getStorageKey method. Generates and 
 * returns the key to be used as storage key. The key represents the full path
 * to the table expressed as "{namespace}.{database name}.{table name}".
 * @return {String}
 */
Table.prototype.getStorageKey = function() 
{
	return [NS, this._db.name, this.name].join(".");
};

Table.prototype.addConstraint = function(props)
{
	if (props.type == TableIndex.TYPE_INDEX ||
		props.type == TableIndex.TYPE_UNIQUE ||
		props.type == TableIndex.TYPE_PRIMARY) 
	{
		var key = TableIndex.fromJSON(props, this);
		this.keys[key.name] = key;
	}
};

Table.prototype.addColumn = function(props)
{//console.log("Table.prototype.addColumn: ", props);
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
	
	if (col.key) {
		// TODO: Add index
	}
	return col;
};

/**
 * Overrides the Persistable.prototype.save method. Saves the table and when 
 * done, also saves the database that this table belongs to.
 * @param {Function} onSuccess
 * @param {Function} onError
 * @return {void}
 * @emits savestart:table - Before the save procedure is started
 * @emits save:table - If the save finishes successfully
 */
Table.prototype.save = function(onComplete, onError) 
{
	var db = this._db, table = this;
	JSDB.events.dispatch("savestart:table", table);
	Persistable.prototype.save.call(this, function() {
		db.save(function() {
			JSDB.events.dispatch("save:table", table);
			if ( isFunction(onComplete) ) {
				onComplete();
			}
		}, onError);	
	}, onError);
	return this;
};

Table.prototype.load = function(onComplete, onError) 
{
	var table = this;
	JSDB.events.dispatch("loadstart:table", table);
	table.read(function(json) {
		var colCount = 0, 
			name;

		function onRowLoad(row) {
			for (var ki in table.keys) {
				table.keys[ki].beforeInsert(row);
			}
			table._ai = Math.max(table._ai, row.id) + 1;
			table.rows[row.id] = row;
			table._length++;
			table._row_seq.push(row.id);
			if (--colCount === 0) {
				JSDB.events.dispatch("load:table", table);
				if (onComplete) onComplete(table);
			}
		}

		if (json) {
			table.cols = {};
			table.rows = {};
			table.keys = {};
			
			// Create columns
			for ( name in json.columns ) {//console.log(name, json.columns[name]);
				table.addColumn(json.columns[name]);
			}

			// Create indexes
			if (json.keys) {
				table.keys = {};
				table.primaryKey = null;
				for ( name in json.keys ) {
					table.keys[name] = TableIndex.fromJSON(json.keys[name], table);
				}
			}
			
			// Create rows
			for ( var key in json.rows ) {//console.log(name, json.columns[name]);
				//table.addColumn(json.columns[name]);
				table.rows[key] = new TableRow(table, key);
				colCount++;
			}

			// Load rows data
			if (colCount) {
				for ( key in table.rows ) {
					table.rows[key].load(onRowLoad, onError);
				}
			} else {
				JSDB.events.dispatch("load:table", table);
				if (onComplete) onComplete(table);
			}


			
			//this.save();
		}
	}, onError);
};

Table.prototype.insert = function(keys, values) 
{
	

	var kl = keys.length,
		rl = values.length,
		cl = this._col_seq.length,
		ki, // user key index 
		ri, // user row index
		ci, // table column index
		row, 
		col, 
		key;

	// for each input row
	for (ri = 0; ri < rl; ri++) {
		row = new TableRow(this, this._ai);
		
		// for each user-specified column
		for (ki = 0; ki < kl; ki++) {
			row.setCellValue(keys[ki], values[ri][ki]);
		}
		//console.dir(row);

		for (ki in this.keys) {
			this.keys[ki].beforeInsert(row);
		}
		
		this.rows[this._ai++] = row;
		this._length++;
		this._row_seq.push(this._ai - 1);
		row.save();
	}

	this.save();

	//console.dir(this.toJSON());
};

Table.prototype.drop = function(onComplete, onError) 
{
	var table     = this, 
		keyPrefix = table.getStorageKey(),
		rowIds    = [],
		id;

	if (JSDB.events.dispatch("before_delete:table", table)) {
		for ( id in table.rows ) {
			rowIds.push(keyPrefix + "." + id);
		}

		
		table.storage.unsetMany(rowIds, function() {
			Persistable.prototype.drop.call(table, function() {
				delete table._db.tables[table.name];
				table._db.save(function() {
					JSDB.events.dispatch("after_delete:table", table);
					if (onComplete) 
						onComplete();
				}, onError);
			}, onError);
		}, onError);
	}
};

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
Table.prototype.getRows = function(filter)
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
};*/

/**
 * Deletes rows from the table.
 * @param {String} what - What to delete. Can be:
 * <ul>
 *   <li>String   - The key of single row that should be deleted</li>
 *   <li>Number   - The index of the row to delete</li>
 *   <li>TableRow - The row to be deleted</li>
 *   <li>Array    - Array of row keys to delete multiple rows</li>
 * </ul>
 * @param {Function} onSuccess
 * @param {Function} onError
 * @return {void}
 */
Table.prototype.deleteRows = function(rows, onComplete, onError)
{
	var table = this,
		keys  = [];
	
	rows = makeArray(rows);

	each(rows, function(row) {
		keys.push(row.getStorageKey());
	});

	// Delete row from the storage
	table.storage.unsetMany(keys, function() {
		
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

		table.save(function() {
			if (onComplete) 
				onComplete();
		}, onError);
	}, onError);
};
