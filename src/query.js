////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                            SQL Query Classes                               //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
function queryFactory(verb, subject, params)
{
	var Fn;
	if (verb == "CREATE") {
		if (subject == "DATABASE") {
			Fn = CreateDatabaseQuery;
		} else if (subject == "TABLE") {
			Fn = CreateTableQuery;
		} else {
			throw new Error(
				"Query for " + verb + "+" + subject + " not implemented"
			);
		}
	}

	var q = new Fn();
	if (params) {
		q.setParams(params);
	}
	return q;
}

function Query() {}
CreateQuery.prototype.setParams = function(params) {};

function CreateQuery() {}
CreateQuery.prototype = new CreateQuery();
CreateQuery.prototype.toString = function() {
	return this.generateSQL();
};



// CreateDatabaseQuery ---------------------------------------------------------

/**
 * Class CreateDatabaseQuery extends CreateQuery
 * @constructor
 */
function CreateDatabaseQuery() {}

/** Inherit from CreateQuery */
CreateDatabaseQuery.prototype = new CreateQuery();

/**
 * The name of the database that will be created. Initially this is undefined.
 * @var {String}
 * @private
 */
CreateDatabaseQuery.prototype._name = undefined;

/**
 * The "If NOT EXISTS" flag. Defaults to false.
 * @var {Boolean}
 * @private
 */
CreateDatabaseQuery.prototype._ifNotExists = false;

/**
 * Generates and returns a "CREATE DATABASE" SQL query. This is used by the 
 * toString method too.
 * @throws {SQLRuntimeError} If the instance is incomplete
 * @return {String} The query as formatted SQL string
 */
CreateDatabaseQuery.prototype.generateSQL = function() 
{
	if (typeof this._name != "string") {
		throw new SQLRuntimeError("Invalid database name");
	}
	if (!this._name) {
		throw new SQLRuntimeError("No database name");
	}
	return "CREATE DATABASE " + (this._ifNotExists ? "IF NOT EXISTS " : "") + 
		quote(this._name, '"');
};

/**
 * Executes the query.
 * @return {void}
 */
CreateDatabaseQuery.prototype.execute = function(next) 
{
	SERVER.createDatabase(this._name, this._ifNotExists, next);
};

/**
 * Sets or gets the "_ifNotExists" flag. If the argument is missing (or if it
 * is undefined) returns the current value. Otherwise the argument is converted
 * to boolean and applied to the "_ifNotExists" flag.
 * @param {Boolean} bIf
 * @return {Boolean|CreateDatabaseQuery} Returns the instance on set or the 
 *                                       _ifNotExists value on get.
 */
CreateDatabaseQuery.prototype.ifNotExists = function(bIf) 
{
	if (bIf === undefined) {
		return this._ifNotExists;
	}
	this._ifNotExists = !!bIf;
	return this;
};

/**
 * Sets or gets the "name" of the database that should be created. If the 
 * argument is falsy returns the current name. Otherwise the argument is 
 * converted to string and written to the "name" property.
 * @param {String} dbName
 * @return {String|CreateDatabaseQuery} Returns the instance on set or the 
 *                                      current name on get.
 */
CreateDatabaseQuery.prototype.name = function(dbName) 
{
	if (dbName) {
		this._name = String(dbName);
		return this;
	}
	return this._name;
};

// CreateTableQuery ------------------------------------------------------------

/**
 * Class CreateDatabaseQuery extends CreateQuery
 * @constructor
 */
function CreateTableQuery() 
{
	this.columns = [];
	this.constraints = [];
}

/** Inherit from CreateQuery */
CreateTableQuery.prototype = new CreateQuery();

/**
 * The name of the table that should be created. Initially this is undefined.
 * @var {String}
 * @private
 */
CreateTableQuery.prototype._name = undefined;

/**
 * The flag indicating if the table should be created as temporary one.
 * Defaults to false.
 * @var {Boolean}
 * @private
 */
CreateTableQuery.prototype._temporary = false;

/**
 * The "If NOT EXISTS" flag. Defaults to false.
 * @var {Boolean}
 * @private
 */
CreateTableQuery.prototype._ifNotExists = false;

/**
 * Sets or gets the "_ifNotExists" flag. If the argument is missing (or if it
 * is undefined) returns the current value. Otherwise the argument is converted
 * to boolean and applied to the "_ifNotExists" flag.
 * @param {Boolean} bIf
 * @return {Boolean|CreateTableQuery} Returns the instance on set or the 
 *                                    _ifNotExists value on get.
 */
CreateTableQuery.prototype.ifNotExists = function(bIf) 
{
	if (bIf === undefined) {
		return this._ifNotExists;
	}
	this._ifNotExists = !!bIf;
	return this;
};

/**
 * Sets or gets the "_temporary" flag. If the argument is missing (or if it
 * is undefined) returns the current value. Otherwise the argument is converted
 * to boolean and applied to the "_temporary" flag.
 * @param {Boolean} bTemp
 * @return {Boolean|CreateTableQuery} Returns the instance on set or the 
 *                                    _temporary value on get.
 */
CreateTableQuery.prototype.temporary = function(bTemp) 
{
	if (bTemp === undefined) {
		return this._temporary;
	}
	this._temporary = !!bTemp;
	return this;
};

/**
 * Generates and returns a "CREATE TABLE" SQL query. This is used by the 
 * toString method too.
 * @throws {SQLRuntimeError} If the instance is incomplete
 * @return {String} The query as formatted SQL string
 */
CreateTableQuery.prototype.generateSQL = function() 
{
	
};

/**
 * Sets or gets the "name" of the table that should be created. If the 
 * argument is falsy returns the current name. Otherwise the argument is 
 * converted to string and written to the "name" property.
 * @param {String} tableName
 * @return {String|CreateTableQuery} Returns the instance on set or the 
 *                                   current name on get.
 */
CreateTableQuery.prototype.name = function(tableName) 
{
	if (tableName) {
		this._name = String(tableName);
		return this;
	}
	return this._name;
};

CreateTableQuery.prototype.addConstraint = function(constraint)
{
	this.constraints.push(constraint);
};

/**
 * Executes the query.
 * @return {void}
 */
CreateTableQuery.prototype.execute = function(next) 
{
	var q = this;

	createTable(
		q.name(), 
		q.columns, //fields
		q.ifNotExists(), 
		null, //database
		function(err, table) {
			if (err)
				return next(err, null);

			var l = q.constraints.length, i;
			
			if (!l)
				return next(null, table);

			for (i = 0; i < l; i++) {
				table.addConstraint(q.constraints[i]);
			}

			table.save(next);
		}
	);

	
};
