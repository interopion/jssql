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
		
			
		transaction.on("rollback", function(error) {
			console.log("Transaction rolled back with error ", error);
			removeTransaction();
		});

		transaction.on("complete", function() {
			console.log("Transaction complete");
			removeTransaction();
		});

		transaction.on("before:task", function(task, pos) {
			console.log("Starting task ", task.name);
		});
		
		transaction.on("after:task", function(task, pos) {
			console.log("Ended task ", task.name);
		});

		return transaction;
	};

	this.commitTransaction = function()
	{
		if (!transaction)
			throw new SQLRuntimeError("There is no current transaction");

		transaction.start();

	};

	this.rollbackTransaction = function(done, fail)
	{
		if (!transaction) {
			var err = new SQLRuntimeError("There is no current transaction");
			if (fail)
				fail(err);
			else
				throw err;
		}

		if (done)
			transaction.one("rollback", done);
		if (fail)
			transaction.one("error", fail);

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

Server.prototype.load = function(onSuccess, onError)
{
	var inst = this;
	JSDB.events.dispatch("loadstart:server", inst);
	this.read(
		function(json) {
			if (!json) {
				JSDB.events.dispatch("load:server", inst);
				onSuccess.call(inst);
				return;
			}

			var databases = [], dbName, dbCount = 0, db, i = 0, loaded = 0;
			
			function onDatabaseLoad(db)
			{
				return function()
				{
					inst.databases[db.name] = db;
					if (++loaded === dbCount) {
						JSDB.events.dispatch("load:server", inst);
						inst.loaded = true;
						onSuccess.call(inst);
					}
				};
			}

			// Clear current databases (if any)
			inst.databases = {};


			if (json.databases) {
				for ( dbName in json.databases ) {
					if (json.databases.hasOwnProperty(dbName)) {
						db = new Database(dbName);
						databases[dbCount++] = db;
					}
				}
			}

			if (dbCount > 0) {
				for ( i = 0; i < dbCount; i++ ) {
					db = databases[i];
					db.load(onDatabaseLoad(db), onError);
				}
			} else {
				inst.loaded = true;
				JSDB.events.dispatch("load:server", inst);
				onSuccess.call(inst);
			}

			//inst.save();
		},
		onError
	);
	//var json = this.read(), db, meta;
	//if (json) {
	//	this.databases = {};
	//	for ( var name in json.databases ) {
	//		db = new Database(name);
	//		db.load();
	//		this.databases[name] = db;
	//	}
	//	this.save();
	//}
	return this;
};

/**
 * Creates and returns new Database
 * @param {String} name The name of the database to create
 * @param {Boolean} ifNotExists Note that an exception will be thrown if such 
 * database exists and this is not set to true.
 * @return {void}
 */
Server.prototype.createDatabase = function(name, ifNotExists) 
{
	if (typeof name != "string") {
		throw new SQLRuntimeError("Invalid database name");
	}

	if (!name) {
		throw new SQLRuntimeError("No database name");
	}

	if (this.databases.hasOwnProperty(name)) {
		if (!ifNotExists) {
			throw new SQLRuntimeError('Database "' + name + '" already exists');
		}
		return this.databases[name];
	}

	var db = new Database(name);
	db.save();
	this.databases[name] = db;
	this.save();
	return db;
};

/**
 * Drops a database from the server.
 * @param {String} name The name of the database to drop
 * @param {Boolean} ifNotExists Note that an exception will be thrown if such 
 * database does not exists and this is not set to true.
 * @return {void}
 */
Server.prototype.dropDatabase = function(name, ifExists, done, fail) 
{
	if (this.databases.hasOwnProperty(name)) {
		if (this.currentDatabase === this.databases[name])
			this.currentDatabase = null;
		this.databases[name].drop();
		delete this.databases[name];
		this.save(done, fail);
	} else {
		if (!ifExists) {
			var err = new SQLRuntimeError('Database "' + name + '" does not exist');
			if (fail)
				return fail(err);
			else 
				throw err;
		}
		if (done)
			done();
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
