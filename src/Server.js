/**
 * @constructor
 * @classdesc The Server class is used to create a single instance that is a 
 * persistable collection of databases.
 * @extends {Persistable}
 */
function Server()
{
	/**
	 * The databases currently in this server
	 * @type {Object}
	 * @private
	 */
	this.databases = {};
}

Server.prototype = new Persistable();
Server.prototype.constructor = Server;

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
Server.prototype.dropDatabase = function(name, ifExists) 
{
	if (this.databases.hasOwnProperty(name)) {
		if (this.currentDatabase === this.databases[name])
			this.currentDatabase = null;
		this.databases[name].drop();
		delete this.databases[name];
		this.save();
	} else {
		if (!ifExists) {
			throw new SQLRuntimeError('Database "' + name + '" does not exist');
		}
	}
};

/**
 * Get a database by name.
 * @param {String} name - The name of the desired database
 * @return {Database|undefined}
 */
Server.prototype.getDatabase = function(name)
{
	return this.databases[trim(name)];
};

Server.prototype.setCurrentDatabase = function(name)
{
	var db = trim(name);
	if (!this.databases.hasOwnProperty(db)) {
		throw new SQLRuntimeError('No such database "%s".', db);
	}
	CURRENT_DATABASE = this.currentDatabase = this.databases[db];
};

Server.prototype.getCurrentDatabase = function()
{
	return this.currentDatabase;
};
