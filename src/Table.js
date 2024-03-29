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
var Table = Persistable.extend({
	
	/**
	 * @constructor
	 */
	construct : function(tableName, db) 
	{
		Persistable.prototype.construct.call(this, "table");

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
		this.parent = this._db      = db;
		this.storage  = db.storage;
		this.bubbleTarget = db;
		this.children = this.rows;

		//Observer.call(this);
	},

	/*
	createIndex : function(options) 
	{
		var name;
		assertType(options, "Object", "Invalid argument for Table.createIndex");
		assertType(options.name, "String", "Invalid index name");
		name = trim(options.name);
		assert(name, "Index name is required");
		assert(!this.keys.hasOwnProperty(name), 'Index "%s" already exists');

		this.keys[name] = {
			index      : [],
			columns    : [],
			onConflict : null
		};
	},
	*/

	/*getPatch : function() 
	{
		var hasChanges = false, out = {}, rowID, row;

		if (this._isDirty) {
			hasChanges = true;
			out[this.getStorageKey()] = JSON.stringify(this.toJSON());
		}

		for ( rowID in this.rows) {
			row = this.rows[rowID];
			if (row._isDirty) {
				hasChanges = true;
				out[row.getStorageKey()] = JSON.stringify(row._data);
			}
		}

		return hasChanges ? out : null;
	},*/

	/**
	 * Generates and returns the JSON representation of the table object. This is 
	 * mostly used by the "save procedure".
	 * @todo The rows property might contain only the IDs instead of full keys
	 * @return {Object}
	 */
	toJSON : function() 
	{
		var json = {
			name    : this.name,
			columns : {},
			keys    : {},
			rows    : this._row_seq
		};
		for (var name in this.cols) {
			json.columns[name] = this.cols[name].toJSON();
		}
		//for ( name in this.rows) {
		//	//json.rows[name] = this.rows[name].toArray();
		//	json.rows[name] = this.rows[name].getStorageKey();
		//}
		for ( name in this.keys ) {
			json.keys[name] = this.keys[name].toJSON();
		}
		return json;
	},

	/**
	 * Overrides the Persistable.prototype.getStorageKey method. Generates and 
	 * returns the key to be used as storage key. The key represents the full path
	 * to the table expressed as "{namespace}.{database name}.{table name}".
	 * @return {String}
	 */
	getStorageKey : function() 
	{
		return [NS, this._db.name, this.name].join(".");
	},

	/**
	 * Add constraint to the table. This can be used if the columns are already
	 * known and created. Creates an index and updates the Column object(s) to refer
	 * to it...
	 */
	addConstraint : function(props)
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

			this._isDirty = true;
		}
	},

	addColumn : function(props)
	{//console.log("addColumn: ", props);
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
		this._isDirty = true;
		
		if (col.key) {
			// TODO: Add index
		}
		return col;
	},

	/**
	 * Overrides the Persistable.prototype.save method. Saves the table and when 
	 * done, also saves the database that this table belongs to.
	 * @param {Function} onSuccess
	 * @param {Function} onError
	 * @return {void}
	 * @emits savestart:table - Before the save procedure is started
	 * @emits save:table - If the save finishes successfully
	 */
	/*save : function(next) 
	{
		var table = this, _next = createNextHandler(next);
		table.emit("savestart:table", table);
		table._db.save(function(err) {
			if (err)
				return _next(err);
			table._isDirty = false;
			table.emit("save:table", table);
			_next(null, table);
		});
		return table;
	},*/

	_insertRow : function(data, key) 
	{
		var row = new TableRow(this, key);
		
		for (var i = 0; i < data.length; i++) {
			row._data[i] = this.cols[this._col_seq[i]].set(data[i]);
		}

		for (var ki in this.keys) {
			this.keys[ki].beforeInsert(row);
		}

		this._ai = Math.max(this._ai, key) + 1;
		this._length++;
		this._row_seq.push(key);
		this.rows[key] = row;
		this._isDirty = true;
	},

	load : function(next) 
	{
		var table = this, _next = createNextHandler(next);

		table.emit("loadstart:table", table);
		
		table.read(function(err, json) {
			
			if (err) 
				return _next(err);

			if (!json) {
				table.emit("load:table", table);
				return _next(null, table);
			}
			
			table.cols       = {};
			table.rows       = {};
			table.keys       = {};
			table._row_seq   = [];
			table._col_seq   = [];
			table._length    = 0;
			table._ai        = 1;
			table.primaryKey = null;
			
			// Create columns
			for ( var name in json.columns ) {
				table.addColumn(json.columns[name]);
			}

			// Create indexes
			if (json.keys) {
				table.keys       = {};
				table.primaryKey = null;
				for ( name in json.keys ) {
					table.keys[name] = TableIndex.fromJSON(json.keys[name], table);
				}
			}

			// Create rowsID list and fetch them together
			var rowIDs = [],
				prefix = table.getStorageKey(),
				len    = json.rows.length;
			for ( var key = 0; key < len; key++ ) {
				rowIDs.push(prefix + "." + json.rows[key]);
			}
			
			// Load rows data
			if (rowIDs.length) {
				table.storage.getMany(rowIDs, function(err, rows) {
					
					if (err) 
						return _next(err);
					
					each(rows, function(data, idx) {
						table._insertRow(data, json.rows[idx]);
					});

					table._isDirty = false;
					table.emit("load:table", table);
					_next(null, table);
				});
			} else {
				table._isDirty = false;
				table.emit("load:table", table);
				_next(null, table);
			}
		});
	},

	insert : function(keys, values, next) 
	{
		var table = this, 
			_next = createNextHandler(next),
			trx = new Transaction({ 
				name  : "Insert into table " + table.name,
				debug : table._db.server.options.debug,
				autoRollback : true
			}),
			kl = keys.length,
			rl = values.length;

		function createRowInserter(idx) {
			var insertID;
			trx.add(Transaction.createTask({
				name : "Insert row " + idx,
				//timeout : 10000,
				execute : function(next) {
					var row = new TableRow(table, table._ai),
						ki;

					try {
					
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
					table._isDirty = true;
					row._isDirty = true;
					
					//next(null, row);
					} catch (ex) {
						return next(ex);
					}
					
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
				//trx.add(Transaction.createTask({
				//	name : "Save table after inserts",
				//	execute : function(next) {
				//		table.save(next);
				//	}
				//}));
				next();
			},
			undo : function(next) {
				next();
			}
		}));

		

		trx.start();
	},

	/**
	 * Updates table row(s)
	 */
	update : function(map, alt, where, onSuccess, onError)
	{
		// The UPDATE can be canceled if a "beforeupdate:table" listener returns false 
		if (!this.emit("beforeupdate:table", this)) {
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
						table.emit("update:table", table);
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
			var rowBackUp = row.toJSON("object"), task = Transaction.createTask({
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
						if (!row.emit("beforeupdate:row", row))
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

						//table._isDirty = true;
						row.emit("update:row", row);

						next(null);

					} catch (ex) {
						next(ex);
					}
				},
				undo : function(done)
				{
					for ( var name in rowBackUp )
						row.setCellValue( name, rowBackUp[name] );
					//table._isDirty = false;
					done();
				}
			});

			trx.add(task);
		}

		each(table.rows, function(row, id) {
			var newRow = row.toJSON("object"), name;

			// Skip rows that don't match the WHERE condition if any
			if (where && !executeCondition( where, newRow ))
				return true;

			createRowUpdater(row, newRow);
		});
		
		trx.start();
	},















	/**
	 * Deletes the table
	 * @param {Function} next(err, table)
	 * @return {void}
	 */
	drop : function(next) 
	{
		var table     = this, 
			keyPrefix = table.getStorageKey(),
			rowIds    = [],
			_next     = createNextHandler(next),
			id;

		if (!table.emit("before_delete:table", table))
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

					table.emit("after_delete:table", table);
					_next(null, table);
				});
			});
		});
	},

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
	getRows : function(filter)
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
	},*/

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
	deleteRows : function(rows, next)
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
			table._isDirty = true;
			table.save(function(err) {
				_next(err);
			});
		});
	}
});
