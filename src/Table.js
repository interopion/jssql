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

/*
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
*/

/**
 * Generates and returns the JSON representation of the table object. This is 
 * mostly used by the "save procedure".
 * @todo The rows property might contain only the IDs instead of full keys
 * @return {Object}
 */
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

/**
 * Add constraint to the table. This can be used if the columns are already
 * known and created. Creates an index and updates the Column object(s) to refer
 * to it...
 */
Table.prototype.addConstraint = function(props)
{
	if (props.type == TableIndex.TYPE_INDEX  ||
		props.type == TableIndex.TYPE_UNIQUE ||
		props.type == TableIndex.TYPE_PRIMARY) 
	{
		var key = TableIndex.fromJSON(props, this);
		this.keys[key.name] = key;
		
		for (var i = 0, l = props.columns.length; i < l; i++)
		{
			this.cols[props.columns[i]].setKey(props.type);
		}
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
Table.prototype.save = function(next) 
{
	var db = this._db, table = this, _next = createNextHandler(next);
	
	events.dispatch("savestart:table", table);
	
	Persistable.prototype.save.call(this, function(err) {
		if (err) {
			return _next(err);
		}

		db.save(function(err) {
			if (err) {
				return _next(err);
			}

			events.dispatch("save:table", table);
			
			_next(null, table);
		});	
	});

	return this;
};

Table.prototype.load = function(next) 
{
	var table = this, _next = createNextHandler(next);

	JSDB.events.dispatch("loadstart:table", table);
	
	table.read(function(err, json) {
		var colCount = 0, 
			name,
			done;

		function onRowLoad(err, row) {
			if (err) {
				if (!done) {
					done = true;
					_next(err, null);
				}
				return false;
			}

			for (var ki in table.keys) {
				table.keys[ki].beforeInsert(row);
			}
			table._ai = Math.max(table._ai, row.id) + 1;
			table.rows[row.id] = row;
			table._length++;
			table._row_seq.push(row.id);
			if (--colCount === 0) {
				JSDB.events.dispatch("load:table", table);
				_next(null, table);
			}
		}
		//console.log(err, json);
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
					table.rows[key].load(onRowLoad);
				}
			} else {
				JSDB.events.dispatch("load:table", table);
				_next(null, table);
			}
		}
	});
};

Table.prototype.insert = function(keys, values, next) 
{
	var table = this, 
		_next = createNextHandler(next),
		trx   = new Transaction({ name : "Insert into table " + table.name }),
		kl    = keys.length,
		rl    = values.length;

	function createRowInserter(idx) {
		var insertID;
		trx.add(Transaction.createTask({
			name : "Insert row " + idx,
			execute : function(next) {
				var row = new TableRow(table, table._ai),
					ki;

				// for each user-specified column
				for (ki = 0; ki < kl; ki++) {
					row.setCellValue(keys[ki], values[idx][ki]);
				}

				for (ki in table.keys) {
					table.keys[ki].beforeInsert(row);
				}

				insertID = table._ai++;
				table.rows[insertID] = row;
				table._length++;
				table._row_seq.push(insertID);
				row.save(next);
			},
			undo : function(next) {
				if (insertID)
					return table.rows[insertID].drop(next);
				next();
			}
		}));
	}

	trx.one("complete", function(e) {
		_next(null, table);
	});

	trx.one("rollback", function(e, err) {
		_next(err, null);
	});

	trx.add(Transaction.createTask({
		name : "insert",
		execute : function(next) {
			for (var i = 0; i < rl; i++) {
				createRowInserter(i);
			}
			next();
		},
		undo : function(next) {
			next();
		}
	}));

	trx.add(Transaction.createTask({
		name : "Save table after inserts",
		execute : function(next) {
			table.save(next);
		}
	}));

	trx.start();
};

/**
 * Updates table row(s)
 */
Table.prototype.update = function(map, alt, where, onSuccess, onError)
{
	// The UPDATE can be canceled if a "beforeupdate:table" listener returns false 
	if (!JSDB.events.dispatch("beforeupdate:table", this)) {
		return onError(null, strf(
			'The UPDATE procedure of table "%s" was canceled by a ' + 
			'"beforeupdate:table" event listener',
			this.getStorageKey()
		));
	}
	
	var table = this, 
		trx = new Transaction({
			name         : "Update " + table.name + " transaction",
			autoRollback : false,
			onError      : handleConflict,
			onComplete   : function() {
				table.save(function(err) {
					if (err)
						return onError(err);
					JSDB.events.dispatch("update:table", table);
					onSuccess();
				});
			}
		}),
		conflictHandled = false;

	// ROLLBACK|ABORT|REPLACE|FAIL|IGNORE
	function handleConflict(error)
	{
		if (conflictHandled)
			return true;

		// This function might be called more than once because of transaction 
		// timeout errors, so make sure that those will not result in multiple 
		// callback invokations!
		conflictHandled = true;
		
		if (error && error instanceof SQLConstraintError) 
		{
			switch (alt) {

				// When an applicable constraint violation occurs, the ROLLBACK 
				// resolution algorithm aborts the current SQL statement with an 
				// SQLConstraintError and rolls back the current transaction. 
				// If no transaction is active (other than the implied 
				// transaction that is created on every command) then the 
				// ROLLBACK resolution algorithm works the same as the ABORT 
				// algorithm.
				case "ROLLBACK":
					trx.setOption("reqursiveRollback", true);
					trx.one("rollback", function() {
						if (onError) onError(error);
						console.info("Update lolled back!");
					});
					trx.rollback();
				break;

				// When an applicable constraint violation occurs, the FAIL 
				// resolution algorithm aborts the current SQL statement with an 
				// SQLConstraintError. But the FAIL resolution does not back out 
				// prior changes of the SQL statement that failed nor does it 
				// end the transaction. For example, if an UPDATE statement 
				// encountered a constraint violation on the 100th row that it 
				// attempts to update, then the first 99 row changes are 
				// preserved but changes to rows 100 and beyond never occur.
				case "FAIL":
					if (onError) 
						onError(error);
				break;

				// When an applicable constraint violation occurs, the IGNORE 
				// resolution algorithm skips the one row that contains the 
				// constraint violation and continues processing subsequent rows 
				// of the SQL statement as if nothing went wrong. Other rows 
				// before and after the row that contained the constraint 
				// violation are inserted or updated normally. No error is 
				// returned when the IGNORE conflict resolution algorithm is used.
				case "IGNORE":
					trx.next();
				break;

				// 
				case "REPLACE":
				break;

				// When an applicable constraint violation occurs, the ABORT 
				// resolution algorithm aborts the current SQL statement with an 
				// SQLConstraintError error and backs out any changes made by 
				// the current SQL statement; but changes caused by prior SQL 
				// statements within the same transaction are preserved and the 
				// transaction remains active. This is the default behavior and 
				// the behavior specified by the SQL standard.
				default: // ABORT
					trx.setOption("reqursiveRollback", false);
					trx.one("rollback", function() {
						if (onError) onError(error);
						console.info("Update lolled back!");
					});
					trx.rollback();
				break;				
			}
		}
		else
		{
			if (onError) 
				onError(error);
		}
	}

	function createRowUpdater(row, newRow) 
	{
		var rowBackUp = row.toJSON(), task = Transaction.createTask({
			name : "Update row " + row.getStorageKey(),
			execute : function(next)
			{
				var name;

				try {

					// Create the updated version of the row
					for ( name in map )
					{
						newRow[name] = executeCondition(map[name], newRow);
					}

					// The UPDATE can be canceled on row level if a 
					// "beforeupdate:row" listener returns false 
					if (!JSDB.events.dispatch("beforeupdate:row", row))
					{
						return next(null);
					}

					// Update table indexes
					for (var ki in table.keys) 
					{
						table.keys[ki].beforeUpdate(row, newRow);
					}

					// Update the actual row
					for ( name in map )
					{
						row.setCellValue( name, newRow[name] );
					}

					JSDB.events.dispatch("update:row", row);

					next(null);

				} catch (ex) {
					next(ex);
				}
			},
			undo : function(done)
			{
				for ( var name in rowBackUp )
					row.setCellValue( name, rowBackUp[name] );
				done();
			}
		});

		trx.add(task);
	}

	each(table.rows, function(row, id) {
		var newRow = row.toJSON(), name;

		// Skip rows that don't match the WHERE condition if any
		if (where && !executeCondition( where, newRow ))
			return true;

		createRowUpdater(row, newRow);
	});
	
	trx.start();
};















/**
 * Deletes the table
 * @param {Function} next(err, table)
 * @return {void}
 */
Table.prototype.drop = function(next) 
{
	var table     = this, 
		keyPrefix = table.getStorageKey(),
		rowIds    = [],
		_next     = createNextHandler(next),
		id;

	if (!events.dispatch("before_delete:table", table))
		return _next(strf('"%s" event  canceled', "before_delete:table"), table);
		
	for ( id in table.rows )
		rowIds.push(keyPrefix + "." + id);
	
	// Delete all the rows
	table.storage.unsetMany(rowIds, function(err) {
		if (err) 
			return _next(err, table);
		
		// Delete the table
		Persistable.prototype.drop.call(table, function(err) {
			if (err)
				return _next(err, table);

			// Update the database
			delete table._db.tables[table.name];
			table._db.save(function(err) {
				if (err)
					return _next(err, table);

				events.dispatch("after_delete:table", table);
				_next(null, table);
			});
		});
	});
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
 * @param {Function} next(err) Optional
 * @return {void}
 */
Table.prototype.deleteRows = function(rows, next)
{
	var table = this,
		keys  = [],
		_next = createNextHandler(next);
	
	rows = makeArray(rows);

	each(rows, function(row) {
		keys.push(row.getStorageKey());
	});

	// Delete row from the storage
	table.storage.unsetMany(keys, function(err) {

		if (err)
			return _next(err);
		
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

		table.save(function(err) {
			_next(err);
		});
	});
};
