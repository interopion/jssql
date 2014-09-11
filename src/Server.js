
var Server = Persistable.extend({

	/**
	 * @constructor
	 * @classdesc The Server class is used to create a single instance that is a 
	 * persistable collection of databases.
	 * @extends {Persistable}
	 */
	construct : function(options)
	{
		Persistable.prototype.construct.call(this, "server");

		/**
		 * The current transaction (if any)
		 * @type {Transaction}
		 */
		this._transaction = null;

		/**
		 * The databases currently in this server
		 * @type {Object}
		 * @private
		 */
		this.databases = {};

		/**
		 * The configuration options for the instance
		 * @type {Object}
		 */
		this.options = {};

		this._queryTasks = {};

		// Make the server instance observable
		//Observer.call(this);

		// Apply the configuration
		this.config(mixin({
			debug : false,
			storageEngine : {
				type : "LocalStorage"
			}
		}, options));

		this.children = this.databases;

		this._init();
	},

	destroy : function(cb) 
	{
		this.off();
		this._destroyTransaction();
		this.children = this.databases = {};
		this.options = {};
		this._queryTasks = {};
	},

	config : function(name, value) {
		var l = arguments.length;
		
		if (!l) {
			return this.options;
		}

		if (l === 1) {
			if (name && typeof name == "object") {
				mixin(this.options, name);
				return this;
			}
			return this.options[name];
		}

		this.options[name] = value;
		return this;
	},

	/**
	 * Checks whether there is a pending transaction
	 * @return {Boolean}
	 */
	isInTransaction : function()
	{

		return !!this._transaction;
	},

	/**
	 * Gets the current transaction (if any)
	 * @return {Transaction|null}
	 */
	getTransaction : function()
	{

		return this._transaction || null;
	},

	_destroyTransaction : function() 
	{
		if (this._transaction) {
			this._transaction.destroy();
			this._transaction = null;
		}
	},

	/**
	 * Starts new transaction
	 */
	beginTransaction : function(options)
	{
		if (this.isInTransaction())
			throw new SQLRuntimeError(
				"There is a current transaction already started"
			);

		this._transaction = new Transaction(mixin({ 
			debug : this.options.debug
		}, options));
		
		var server = this;
			
		this._transaction.on("rollback", function(e, error) {
			server._destroyTransaction();
		});

		this._transaction.on("complete", function() {
			server._destroyTransaction();
		});

		return this._transaction;
	},

	commitTransaction : function()
	{
		if (!this.isInTransaction())
			throw new SQLRuntimeError("There is no current transaction");

		this._transaction.start();
	},

	rollbackTransaction : function(next)
	{
		if (!this._transaction) {
			next(new SQLRuntimeError("There is no current transaction"));
		}

		if (next) {
			this._transaction.one("rollback", function() {
				next();
			});
		}

		this._transaction.rollback();
	},

	/**
	 * Return the storage key for the server object. This is used to identify it
	 * inside a key-value based storage.
	 * @return {String}
	 */
	getStorageKey : function()
	{

		return NS;
	},

	/*getPatch : function() 
	{
		var hasChanges = false, out = {}, dbName, db, patch;

		if (this._isDirty) {
			hasChanges = true;
			out[this.getStorageKey()] = JSON.stringify(this.toJSON());
		}

		for ( dbName in this.databases) {
			db = this.databases[dbName];
			patch = db.getPatch();
			if (patch) {
				hasChanges = true;
				mixin(out, patch);
			}
		}

		return hasChanges ? out : null;
	},*/

	/**
	 * Overrides {@link Persistable.prototype.toJSON}
	 * @return {Object}
	 */
	toJSON : function()
	{
		var json = { databases : {} };
		for ( var name in this.databases ) {
			json.databases[name] = this.databases[name].getStorageKey();
		}
		return json;
	},

	/**
	 * Loads the server from the storage. This will recursively load the 
	 * databases, tables and rows.
	 * @param {Function} next(error, server)
	 * @return {Server}
	 */
	load : function(next)
	{
		var server = this,
			trx = new Transaction({
				name    : "Load Server",
				timeout : 10000,
				debug   : !!this.options.debug
			}),
			_next = createNextHandler(next);

		trx.on("complete", function(e) {
			server.loaded = true;
			server.emit("load:server", server);
			_next(null, server);
		});

		trx.on("rollback", function(e, err) {
			_next(err, null);
		});

		function createDatabaseLoader(dbName) {
			trx.add(Transaction.createTask({
				name : "Load Database '" + dbName + "'",
				execute : function(next) {
					var db = new Database(dbName, server);
					server.databases[db.name] = db;
					db.load(next);
				},
				undo : function(next) {
					next(null);
				}
			}));
		}

		trx.add(Transaction.createTask({
			name : "Load Server Storage",
			execute : function(next) {
				Storage.getEngine(server.options.storageEngine, function(err, store) {
					if ( err )
						return next(err, null);

					server.storage = store;
					next(null, store);
				});
			}
		}));

		trx.add(Transaction.createTask({
			name : "Load Server",
			timeout : 10000,
			execute : function(next) {
				//server.children = server.databases = {};

				server.read(function(err, json) {
					if ( err )
						return next(err, server);

					server.children = server.databases = {}; // Clear current databases (if any)

					if ( !json || !json.databases )
						return next(null, server);

					//console.log("SERVER JSON: ", json);
					for ( var dbName in json.databases ) {
						createDatabaseLoader(dbName);
					}

					server._isDirty = false;
					return next(null, server);
				});
			}
		}));

		server.emit("loadstart:server", server);
		trx.start();
		return server;
	},

	/*save : function(next) 
	{
		var server = this,
			_next  = createNextHandler(next),
			patch  = server.getPatch();

		if (!patch)
			return _next(null, server);

		server.emit("savestart:server", server);
		//console.log("Changes:\n%s", JSON.stringify(patch, null, 4));
		server.storage.setMany(patch, function(err) {
			if (err)
				return _next(err, null);

			server._isDirty = false;
			server.emit("save:server", server);
			_next(null, server);
		});

		return server;
	},*/

	/**
	 * Creates and returns new Database
	 * @param {String} name The name of the database to create
	 * @param {Boolean} ifNotExists Note that an exception will be thrown if such 
	 * database exists and this is not set to true.
	 * @param {Function} next(error, server)
	 * @return {void}
	 */
	createDatabase : function(name, ifNotExists, next) 
	{
		var _next = createNextHandler(next),
			server = this;

		if (typeof name != "string")
			return _next(
				new SQLRuntimeError("Invalid database name"),
				null
			);

		if (!name)
			return _next(
				new SQLRuntimeError("No database name"),
				null
			);

		if (server.databases.hasOwnProperty(name)) {
			if (!ifNotExists) {
				return _next(
					new SQLRuntimeError('Database "' + name + '" already exists'),
					null
				);
			}
			return _next(null, server.databases[name]);
		}

		var db = new Database(name, server);
		server.databases[name] = db;
		server._isDirty = true;
		this.save(function(err) {
			if (err) {
				delete server.databases[name];
				return _next(err, db);
			}
			_next(null, db);
		});
		//db.save(function(err) {
		//	if (err) {
		//		delete server.databases[name];
		//		return _next(err, db);
		//	}
		//	_next(null, db);
		//});
	},

	/**
	 * Drops a database from the server.
	 * @param {String} name The name of the database to drop
	 * @param {Boolean} ifNotExists Note that an exception will be thrown if such 
	 * database does not exists and this is not set to true.
	 * @return {void}
	 */
	dropDatabase : function(name, ifExists, next) 
	{
		var _next  = createNextHandler(next),
			server = this,
			db     = server.databases[name],
			tableName,
			table,
			rowID,
			prefix,
			keys;

		if (!db)
			return _next(
				ifExists ? 
					null : 
					new SQLRuntimeError('Database "' + name + '" does not exist'), 
				server
			);

		keys = [db.getStorageKey()];
		for ( tableName in db.tables ) {
			table = db.tables[tableName];
			prefix = table.getStorageKey();
			keys.push( prefix );
			for ( rowID in table.rows ) {
				keys.push(prefix + "." + rowID);
			}
		}

		server._isDirty = true;
		server.storage.unsetMany(keys, function(err) {
			if (err)
				return _next(err, server);

			if (server.currentDatabase === db)
				server.currentDatabase = null;

			delete server.databases[name];

			server.save(function(err) {
				_next(err, server);
			});
		});
			
		/*server.databases[name].drop(function(err, db) {
			if (err)
				return _next(err, server);

			if (server.currentDatabase === db)
				server.currentDatabase = null;

			delete server.databases[name];

			server.save(function(err) {
				_next(err, server);
			});
		});*/
	},

	/**
	 * Get a database by name.
	 * @param {String} name - The name of the desired database
	 * @return {Database|undefined}
	 */
	getDatabase : function(name, throwError)
	{
		var db;
		if (!name) {
			db = this.currentDatabase;
			if (!db) {
				if (throwError === false)
					return null;

				throw new SQLRuntimeError( 'No database selected.' );
			}
		} else {
			db = this.databases[name];
			if (!db) {
				if (throwError === false)
					return null;
				
				throw new SQLRuntimeError( 'No such database "%s"', name );
			}
		}
		
		return db;
	},

	/**
	 * Selects the specified database as the currently used one.
	 * @throws {SQLRuntimeError} error If the databse does not exist
	 * @return {Server} Returns the Server instance
	 */
	setCurrentDatabase : function(name)
	{
		var db = trim(name);
		if (!this.databases.hasOwnProperty(db)) {
			throw new SQLRuntimeError('No such database "%s".', db);
		}
		this.currentDatabase = this.databases[db];
		return this;
	},

	/**
	 * Returns the currently used database (if any).
	 * @return {Database|undefined}
	 */
	getCurrentDatabase : function()
	{
		return this.currentDatabase || null;
	},

	getTable : function(tableName, dbName, throwError)
	{			
		var db = this.getDatabase(dbName, throwError), 
			table;

		if (!db) 
			return null;
		
		table = db.tables[tableName];

		if (!table) {
			if (throwError === false) 
				return null;
			
			throw new SQLRuntimeError(
				'No such table "%s" in database "%s"',
				tableName,
				db.name
			);
		}
		
		return table;
	},

	_init : function() {
		var server = this;

		each({
			"SHOW DATABASES"         : "SHOW_DATABASES",
			"SHOW SCHEMAS"           : "SHOW_DATABASES",
			"SHOW TABLES"            : "SHOW_TABLES",
			"SHOW COLUMNS"           : "SHOW_COLUMNS",
			"CREATE DATABASE"        : "CREATE_DATABASE",
			"CREATE SCHEMA"          : "CREATE_DATABASE",
			"CREATE TABLE"           : "CREATE_TABLE",
			"CREATE TEMPORARY TABLE" : "CREATE_TABLE",
			"DROP DATABASE"          : "DROP_DATABASE",
			"DROP SCHEMA"            : "DROP_DATABASE",
			"DROP TABLE"             : "DROP_TABLE",
			"DROP TEMPORARY TABLE"   : "DROP_TABLE",
			"SELECT"                 : "SELECT",
			"USE"                    : "USE",
			"UPDATE"                 : "UPDATE",
			"INSERT"                 : "INSERT",
			"DELETE"                 : "DELETE",
			"SOURCE"                 : "SOURCE",
			"BEGIN"                  : "BEGIN"
		}, function(name, stmt) {
			this._queryTasks[stmt] = this._createQueryTask(name);
		}, this);

		this._queryTasks.COMMIT = this._queryTasks.END = function(index, next) {
			var tx = server.getTransaction(), walker = this, result;
			
			if (!tx) {
				return next(
					new SQLRuntimeError("There is no transaction to commit"), 
					null, 
					index
				);
			}

			result = new Result();

			if (tx.isEmpty()) {
				STATEMENTS.COMMIT(walker).execute(noop);
				result.setData("Empty transaction committed");
				next(null, result, index);
			} else {
				result.setData("Transaction committed");
				next(null, result, index);
				tx.one("complete", function() {
					result.setData("Transaction complete");
					next(null, result, index);
				});
				tx.one("rollback", function(e, err) {
					next(
						new SQLRuntimeError(
							"Transaction rolled back!" + (err ? "\n" + err : "")
						), 
						null,
						index
					);
				});
				STATEMENTS.COMMIT(walker).execute(noop);
			}
		};

		this._queryTasks.ROLLBACK = function(index, next) {
			var tx = server.getTransaction(), walker = this, result;

			if (!tx) {
				return next(
					new SQLRuntimeError("There is no transaction to rollback"), 
					null, 
					index
				);
			}

			result = new Result();

			if (tx.isEmpty()) {
				STATEMENTS.ROLLBACK(walker).execute(noop);
				result.setData("Empty transaction rolled back");
				next(null, result, index);
			} else {
				tx.one("rollback", function() {
					result.setData("Transaction rolled back!");
					next(null, result, index);
				});
				STATEMENTS.ROLLBACK(walker).execute(noop);
			}
		};
	},


	_handleQuery : function(queries, index, callback, len) {
		
		var query = queries[index], server = this;

		// All done already
		if (!query) 
			return;

		if (this.options.debug)
			console.info("Query: ", query.sql);

		try {
			(new Walker(query.tokens, query.sql, this)).pick(
				this._queryTasks, 
				false, 
				[
					index, 
					function(err, result, queryIndex) {
						callback(err, result, queryIndex, len);
						if (!err)
							server._handleQuery(
								queries, 
								index + 1, 
								callback, 
								len
							);
					}
				]
			);
		} catch (ex) {
			callback(ex, null, index, len);
		}
	},

	_createQueryTask : function(name) {
		var server = this;
		return function(queryIndex, next) {
			var fn = STATEMENTS[name],
				tx = server.getTransaction(),
				result = new Result(),
				walker = this,
				task;
			
			if (tx) {
				task = fn(walker);
				tx.add(Transaction.createTask({
					name : name,
					execute : function(_next) {
						var _result = new Result();
						task.execute(function(err, res) {
							if (err) {
								task.undo(function() {
									_next(err);
								});
							} else {
								_result.setData(res);
								next(null, _result, queryIndex);
								_next();
							}
						});
					},
					undo : function(_next) {
						task.undo(function() {
							_next();
						});
					}
				}));
				result.setData(name + " query added to the transaction");
				next(null, result, queryIndex);
			} else {
				task = fn(walker);
				task.execute(function(err, r) {
					if (err) {
						return task.undo(function() {
							next(err, null, queryIndex);	
						});
					}
					result.setData(r);
					next(null, result, queryIndex);
				});
			}
		};
	},

	query : function(sql, callback) {
		var queries, len;

		// First we need to split the SQL into queries because the behavior is
		// very different for single vs multiple queries
		try {
			queries = sql instanceof QueryList ? sql : getQueries(sql);
		} catch (err) {
			return callback(err, null, -1, 0);
		}

		// The number of SQL queries
		len = queries.length;

		if (!len) {
			return callback(null, new Result("No queries executed"));
		}

		this._handleQuery(queries, 0, callback, len);
	}
});
