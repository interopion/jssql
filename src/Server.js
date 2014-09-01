/**
 * @constructor
 * @classdesc The Server class is used to create a single instance that is a 
 * persistable collection of databases.
 * @extends {Persistable}
 */
function Server()
{
	var transaction = null;

	/**
	 * The databases currently in this server
	 * @type {Object}
	 * @private
	 */
	this.databases = {};

	// Transaction management methods ------------------------------------------

	/**
	 * Checks whether there is a pending transaction
	 * @return {Boolean}
	 */
	this.isInTransaction = function()
	{
		return !!transaction;
	};

	/**
	 * Gets the current transaction (if any)
	 * @return {Transaction|null}
	 */
	this.getTransaction = function()
	{
		return transaction || null;
	};

	/**
	 * Starts new transaction
	 */
	this.beginTransaction = function(options)
	{
		if (transaction)
			throw new SQLRuntimeError(
				"There is a current transaction already started"
			);

		transaction = new Transaction(options);

		function removeTransaction() {
			transaction.destroy();
			transaction = null;
		}
			
		transaction.on("rollback", function(e, error) {
			if (CFG.debug) console.warn("Transaction rolled back with error ", error);
			removeTransaction();
		});

		transaction.on("complete", function() {
			if (CFG.debug) console.info("Transaction complete");
			removeTransaction();
		});

		if (CFG.debug) {
			transaction.on("before:task", function(e, task, pos) {
				console.info('Starting task "%s"', task.name);
			});
			
			transaction.on("after:task", function(e, task, pos) {
				console.info('Ended task "%s"', task.name);
			});
		}

		return transaction;
	};

	this.commitTransaction = function()
	{
		if (!transaction)
			throw new SQLRuntimeError("There is no current transaction");

		transaction.start();

	};

	this.rollbackTransaction = function(next)
	{
		if (!transaction) {
			next(new SQLRuntimeError("There is no current transaction"));
		}

		if (next) {
			transaction.one("rollback", function() {
				next();
			});
		}

		transaction.rollback();
	};
}

Server.prototype = new Persistable();
Server.prototype.constructor = Server;

/**
 * Return the storage key for the server object. This is used to identify it
 * inside a key-value based storage.
 * @return {String}
 */
Server.prototype.getStorageKey = function()
{
	return NS;
};

/**
 * Overrides {@link Persistable.prototype.toJSON}
 * @return {Object}
 */
Server.prototype.toJSON = function()
{
	var json = { databases : {} };
	for ( var name in this.databases ) {
		json.databases[name] = this.databases[name].getStorageKey();
	}
	return json;
};

/**
 * Loads the server from the storage. This will recursively load the databases,
 * tables and rows.
 * @param {Function} next(error, server)
 * @return {Server}
 */
Server.prototype.load = function(next)
{
	var server = this,
		trx = new Transaction({
			name : "Load Server"
		}),
		_next = createNextHandler(next);

	trx.one("complete", function(e) {
		server.loaded = true;
		events.dispatch("load:server", server);
		_next(null, server);
	});

	trx.one("rollback", function(e, err) {
		_next(err, server);
	});

	function createDatabaseLoader(dbName) {
		trx.add(Transaction.createTask({
			name : "Load Database '" + dbName + "'",
			execute : function(next) {
				var db = new Database(dbName);
				server.databases[db.name] = db;
				db.load(next);
			},
			undo : function(next) {
				next(null, server.databases[db.name]);
			}
		}));
	}

	trx.add(Transaction.createTask({
		name : "Load Server",
		execute : function(next) {
			server.read(function(err, json) {
				if ( err )
					return next(err, server);

				server.databases = {}; // Clear current databases (if any)

				if ( !json || !json.databases )
					return next(null, server);

				for ( var dbName in json.databases ) {
					if (json.databases.hasOwnProperty(dbName)) {						
						createDatabaseLoader(dbName);
					}
				}

				return next(null, server);
			});
		}
	}));

	events.dispatch("loadstart:server", server);
	trx.start();
	return server;
};

Server.prototype.save = function(next) 
{
	var server = this,
		_next = createNextHandler(next);

	events.dispatch("savestart:server", server);
	
	Persistable.prototype.save.call(server, function(err) {
		if (err)
			return _next(err, null);

		events.dispatch("save:server", server);
		_next(null, server);
	});

	return server;
};

/**
 * Creates and returns new Database
 * @param {String} name The name of the database to create
 * @param {Boolean} ifNotExists Note that an exception will be thrown if such 
 * database exists and this is not set to true.
 * @param {Function} next(error, server)
 * @return {void}
 */
Server.prototype.createDatabase = function(name, ifNotExists, next) 
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

	if (this.databases.hasOwnProperty(name)) {
		if (!ifNotExists) {
			return _next(
				new SQLRuntimeError('Database "' + name + '" already exists'),
				null
			);
		}
		return _next(null, this.databases[name]);
	}

	var db = new Database(name);

	db.save(function(err) {
		if (err)
			return _next(err, db);

		server.databases[name] = db;

		db.save(function(err) {
			if (err)
				return _next(err, db);

			_next(null, db);
		});
	});
};

/**
 * Drops a database from the server.
 * @param {String} name The name of the database to drop
 * @param {Boolean} ifNotExists Note that an exception will be thrown if such 
 * database does not exists and this is not set to true.
 * @return {void}
 */
Server.prototype.dropDatabase = function(name, ifExists, next) 
{
	var _next = createNextHandler(next),
		server = this;

	if (server.databases.hasOwnProperty(name)) {
		
		server.databases[name].drop(function(err, db) {
			if (err)
				return _next(err, server);

			if (server.currentDatabase === db)
				server.currentDatabase = null;

			delete server.databases[name];

			server.save(function(err) {
				_next(err, server);
			});
		});
		
	} else {
		_next(
			ifExists ? 
				null : 
				new SQLRuntimeError('Database "' + name + '" does not exist'), 
			server
		);
	}
};

/**
 * Get a database by name.
 * @param {String} name - The name of the desired database
 * @return {Database|undefined}
 */
Server.prototype.getDatabase = function(name)
{
	return this.databases[
		trim(name)
	];
};

/**
 * Selects the specified database as the currently used one.
 * @throws {SQLRuntimeError} error If the databse does not exist
 * @return {Server} Returns the Server instance
 */
Server.prototype.setCurrentDatabase = function(name)
{
	var db = trim(name);
	if (!this.databases.hasOwnProperty(db)) {
		throw new SQLRuntimeError('No such database "%s".', db);
	}
	CURRENT_DATABASE = this.currentDatabase = this.databases[db];
	return this;
};

/**
 * Returns the currently used database (if any).
 * @return {Database|undefined}
 */
Server.prototype.getCurrentDatabase = function()
{
	return this.currentDatabase;
};
