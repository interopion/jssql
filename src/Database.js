////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                             Class Database                                 //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
var Database = Persistable.extend({
	
	/**
	 * @constructor
	 * @classdesc The Server class is used to create databases which are 
	 * persistable collections of tables.
	 * @extends {Persistable}
	 */
	construct : function(name, server) 
	{
		Persistable.prototype.construct.call(this, "database");
		this.tables  = {};
		this.name    = name;
		this.parent = this.server  = server;
		this.storage = server.storage;
		this.bubbleTarget = server;
		this.children = this.tables;

		//Observer.call(this);
	},

	/*getPatch : function() 
	{
		var hasChanges = false, out = {}, tableName, table, patch;

		if (this._isDirty) {
			hasChanges = true;
			out[this.getStorageKey()] = JSON.stringify(this.toJSON());
		}

		for ( tableName in this.tables) {
			table = this.tables[tableName];
			patch = table.getPatch();
			if (patch) {
				hasChanges = true;
				mixin(out, patch);
			}
		}

		return hasChanges ? out : null;
	},*/

	toJSON : function() 
	{
		var out = { name : this.name, tables : {} }, t;
		for (t in this.tables) {
			out.tables[t] = [NS, this.name, t].join(".");
		}
		return out;
	},

	getStorageKey : function() 
	{
		return NS + "." + this.name;
	},

	drop : function(next)
	{
		var _next = createNextHandler(next),
			db = this,
			tx = new Transaction({
				name : "Drop Database"
			}),
			name;

		function addDropTableTask(table) {
			tx.add(Transaction.createTask({
				name : 'Drop Table "' + table.name + '"',
				execute : function(next) {
					delete db.tables[table.name];
					table.drop(next);
				},
				undo : function(next) {
					db.tables[table.name] = table;
					next();
				}
			}));
		}

		tx.one("complete", function(e) {
			_next(null, db);
		});

		tx.one("rollback", function(e) {
			_next(e, db);
		});
		
		for ( name in db.tables ) {
			addDropTableTask( db.tables[name] );
		}

		tx.add(Transaction.createTask({
			name : 'Drop Database "' + db.name + '"',
			execute : function(next) {
				delete db.server.databases[db.name];
				Persistable.prototype.drop.call(db, next);
			},
			undo : function(next) {
				db.server.databases[db.name] = db;
				next();
			}
		}));
		
		tx.start();
	},

	load : function(next) 
	{
		var db    = this,
			tx    = new Transaction({
				name  : "Load Database",
				debug : !!this.server.options.debug
			}),
			_next = createNextHandler(next);

		function addLoadTableTask(table) {
			tx.add(Transaction.createTask({
				name : 'Load Table "' + table.name + '"',
				execute : function(next) {
					table.load(next);
				},
				undo : function(next) {
					next(null, table);
				}
			}));
		}

		db.emit("loadstart:database", db);

		tx.one("complete", function(e) {
			db.emit("load:database", db);
			_next(null);
		});

		tx.one("rollback", function(e, err) {
			_next(err);
		});

		tx.add(Transaction.createTask({
			name : "Create DB Tables",
			execute : function(next) {
				db.read(function(err, json) {
					if (err)
						return next(err, db);

					db.tables = {};

					if (!json || !json.tables)
						return next(null, db);

					for ( var name in json.tables ) {
						var table = new Table(name, db);
						db.tables[table.name] = table;
						addLoadTableTask(table);
					}

					db._isDirty = false;
					return next(null, db);
				});
			},
			undo : function(next) {
				console.warn("Undoing Create DB Tables task");
				next();
			}
		}));

		tx.start();

		return db;
	},

	/*save : function(next) 
	{
		var db = this,
			_next = createNextHandler(next);

		db.emit("savestart:database", db);
		//console.log("Changes in database %s:\n%s", this.name, JSON.stringify(this.getPatch(), null, 4));
		//Persistable.prototype.save.call(db, function(err) {
		//	if (err)
		//		return _next(err, null);

			db.server.save(function(err) {
				if (err)
					return _next(err, null);

				db._isDirty = false;
				db.emit("save:database", db);
				return _next(null, db);
			});
		//});

		return db;
	},*/

	/**
	 * { name: "", fields : [], constraints : [], ifNotExists : bool }
	 */
	createTable : function(cfg, next) {
		var _next = createNextHandler(next),
			db = this,
			table, 
			i, l;

		if (db.tables.hasOwnProperty(cfg.name) && !cfg.ifNotExists) {
			return _next(new SQLRuntimeError(
				'Table "%s" already exists', 
				cfg.name
			), null);
		}

		table = new Table(cfg.name, db);

		l = cfg.fields.length;
		for (i = 0; i < l; i++) {
			table.addColumn(cfg.fields[i]);
		}

		l = cfg.constraints.length;
		for (i = 0; i < l; i++) {
			table.addConstraint(cfg.constraints[i]);
		}

		db.tables[cfg.name] = table;
		db._isDirty = true;
		table.save(function(err) {
			if (err) {
				delete db.tables[cfg.name];
				return _next(err, null);
			}
			_next(null, table);
		});
	},

	/**
	 * @param {Function} next(err, table)
	 
	createTable : function(name, fields, ifNotExists, next)
	{
		var _next = createNextHandler(next),
			db = this,
			table, col;

		if (db.tables.hasOwnProperty(name) && !ifNotExists) {
			return _next(new SQLRuntimeError('Table "%s" already exists', name), null);
		}

		table = new Table(name, this);
		
		for (col = 0; col < fields.length; col++) {
			table.addColumn(fields[col]);
		}
		
		db.tables[name] = table;
		table.save(function(err) {
			if (err) {
				delete db.tables[name];
				return _next(err, null);
			}
			_next(null, table);
		});
	},*/

	/**
	 * Get a table by name from the database.
	 * @param {String} name - The name of the desired table
	 * @return {Table}
	 * @throws {SQLRuntimeError} error - If there is no such table
	 */
	getTable : function(tableName, throwError)
	{			
		var table = this.tables[tableName];
		if (!table) {
			if (throwError === false)
				return null;
			throw new SQLRuntimeError(
				'No such table "%s" in database "%s"',
				tableName,
				this.name
			);
		}
		return table;
	}
});
