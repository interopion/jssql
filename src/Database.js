////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                             Class Database                                 //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @classdesc The Server class is used to create databases which are persistable 
 * collections of tables.
 * @extends {Persistable}
 */
function Database(name) 
{
	this.tables = {};
	this.name = name;
}

Database.prototype = new Persistable();
Database.prototype.constructor = Database;

Database.prototype.toJSON = function() 
{
	var out = { name : this.name, tables : {} }, t;
	for (t in this.tables) {
		out.tables[t] = [NS, this.name, t].join(".");
	}
	return out;
};

Database.prototype.getStorageKey = function() 
{
	return NS + "." + this.name;
};

Database.prototype.drop = function(next)
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
			delete SERVER.databases[db.name];
			Persistable.prototype.drop.call(db, next);
		},
		undo : function(next) {
			SERVER.databases[db.name] = db;
			next();
		}
	}));
	
	tx.start();
};

Database.prototype.load = function(next) 
{
	var db    = this,
		tx    = new Transaction({
			name : "Load Database"
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

	events.dispatch("loadstart:database", db);

	tx.one("complete", function(e) {
		events.dispatch("load:database", db);
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
};

Database.prototype.save = function(next) 
{
	var db = this,
		_next = createNextHandler(next);

	events.dispatch("savestart:database", db);
	
	Persistable.prototype.save.call(db, function(err) {
		if (err)
			return _next(err, null);

		SERVER.save(function(err) {
			if (err)
				return _next(err, null);

			events.dispatch("save:database", db);
			return _next(null, db);
		});
	});

	return db;
};

/**
 * @param {Function} next(err, table)
 */
Database.prototype.createTable = function(name, fields, ifNotExists, next)
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
	
	table.save(function(err) {
		if (err) 
			return _next(err, null);

		db.tables[name] = table;
		db.save(function(err) {
			if (err) 
				return _next(err, null);

			_next(null, table);
		});
	});
};

/**
 * Get a table by name from the database.
 * @param {String} name - The name of the desired table
 * @return {Table}
 * @throws {SQLRuntimeError} error - If there is no such table
 */
Database.prototype.getTable = function(tableName)
{			
	var table = this.tables[tableName];
	if (!table) {
		throw new SQLRuntimeError(
			'No such table "%s" in database "%s"',
			tableName,
			this.name
		);
	}
	return table;
};
