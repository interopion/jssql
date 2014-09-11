/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {Function}
 * @example
 * <pre style="font-family:Menlo, monospace">
 * 
 *     ┌────────┐                             ┌──────────────┐  
 *  >──┤ UPDATE ├──┬──────────────────────┬───┤ "table name" ├──┐
 *     └────────┘  │ ┌────┐  ┌──────────┐ │   └──────────────┘  │
 *                 ├─┤ OR ├──┤ ROLLBACK ├─┤                     │
 *                 │ └────┘  └──────────┘ │                     │
 *                 │ ┌────┐  ┌──────────┐ │                     │
 *                 ├─┤ OR ├──┤  ABORT   ├─┤                     │
 *                 │ └────┘  └──────────┘ │                     │
 *                 │ ┌────┐  ┌──────────┐ │                     │
 *                 ├─┤ OR ├──┤ REPLACE  ├─┤                     │
 *                 │ └────┘  └──────────┘ │                     │
 *                 │ ┌────┐  ┌──────────┐ │                     │
 *                 ├─┤ OR ├──┤   FAIL   ├─┤                     │
 *                 │ └────┘  └──────────┘ │                     │
 *                 │ ┌────┐  ┌──────────┐ │                     │
 *                 └─┤ OR ├──┤  IGNORE  ├─┘                     │
 *                   └────┘  └──────────┘                       │
 *   ┌──────────────────────────────────────────────────────────┘  
 *   │ ┌─────┐     ┌───────────────┐ ┌───┐ ┌───────┐    ┌───────┐  ┌───────┐
 *   └─┤ SET ├──┬──┤ "column name" ├─┤ = ├─┤ expr. ├──┬─┤ WHERE ├──┤ expr. ├──>
 *     └─────┘  │  └───────────────┘ └───┘ └───────┘  │ └───────┘  └───────┘
 *              │               ┌───┐                 │
 *              └───────────────┤ , │<────────────────┘
 *                              └───┘
 *             
 *
 * </pre>
 */
STATEMENTS.UPDATE = function(walker) {

	/**
	 * This will match any string (in any quotes) or just a word as unquoted 
	 * name.
	 * @type {String}
	 * @inner
	 * @private
	 */ 
	var identifier = [
		"@" + TOKEN_TYPE_WORD,
		"@" + TOKEN_TYPE_SINGLE_QUOTE_STRING,
		"@" + TOKEN_TYPE_DOUBLE_QUOTE_STRING,
		"@" + TOKEN_TYPE_BACK_TICK_STRING
	].join("|");

	/**
	 * Parses the OR part of the UPDATE statement.
	 * @param {Walker} walker
	 * @return {String} The name af the action to take on failure. One of 
	 * ROLLBACK|ABORT|REPLACE|FAIL|IGNORE. Defaults to ABORT.
	 */
	function getAltBehavior(walker)
	{
		var or = "ABORT";

		if ( walker.is("OR") )
		{
			walker.forward().require("ROLLBACK|ABORT|REPLACE|FAIL|IGNORE");
			or = walker.get().toUpperCase();
			walker.forward();
		}

		return or;
	}

	/**
	 * Gets the table that is to be updated
	 * @param {Walker} walker
	 * @return {Table}
	 */
	function getTable(walker)
	{
		var tableName, dbName, db;

		if ( !walker.is(identifier) )
		{
			throw new SQLParseError(
				'Expecting a table identifier before "%s"',
				walker.get()
			);
		}

		tableName = walker.get();

		if ( walker.forward().is(".") )
		{
			if ( !walker.forward().is(identifier) )
			{
				throw new SQLParseError(
					'Expecting an identifier for table name after %s.',
					tableName
				);
			}

			dbName = tableName;
			tableName = walker.get();
			walker.forward();
		}

		db = dbName ?
			walker.server.getDatabase(dbName) :
			walker.server.getCurrentDatabase();

		if ( !db )
		{
			if ( dbName )
			{
				throw new SQLRuntimeError("No such database '%s'", dbName);
			}
			else
			{
				throw new SQLRuntimeError("No database selected");
			}
		}

		return db.getTable(tableName);
	}

	/**
	 * Parses the WHERE part of the UPDATE statement.
	 * @param {Walker} walker
	 * @return {String} The WHERE expression.
	 */
	function getWhere(walker)
	{
		var where = "", start, end;

		if ( walker.is("WHERE") ) 
		{
			walker.forward();
			start = walker.current()[2];
			end   = start;
			walker.nextUntil(";");
			end   = walker.current()[2];
			where = walker._input.substring(start, end);
		}

		return where;
	}

	/**
	 * Parses the SET part of the UPDATE statement and returns a map object
	 * containing the column names as keys and value expressions as values that
	 * should be applied.
	 * @param {Walker} walker
	 * @return {Object}
	 */
	function getUpdater(walker)
	{
		var updater = {};

		function getPair()
		{
			var name, value, start, end;

			if ( !walker.is(identifier) )
			{
				throw new SQLParseError(
					'Expecting a column identifier before "%s"',
					walker.get()
				);
			}

			name = walker.get();

			walker.forward();
			walker.require("=");
			start = walker.current()[3];
			walker.forward();

			
			end   = start;
			walker.nextUntil(",|WHERE|;");
			end   = walker.current()[2];
			value = trim(walker._input.substring(start, end));
			//console.log(value);

			updater[name] = value;

			if (walker.is(",")) {
				walker.forward();
				getPair();
			}
		}

		walker.require("SET");
		walker.forward();
		getPair();

		return updater;
	}

	return new Task({
		name : "Update Table",
		execute : function(next)
		{
			var or      = getAltBehavior(walker),
				table   = getTable(walker),
				updater = getUpdater(walker),
				where   = getWhere(walker);

			walker.errorUntil(";").commit(function() {
				table.update(
					updater, 
					or, 
					where, 
					function() {
						next(null, "DONE");
					}, 
					function(e) {
						next(e, null);
					}
				);
			});
		},
		undo : function(next) {
			if (walker.server.options.debug)
				console.warn("undo is not implemented for UPDATE queries yet!");
			next();
		}
	});
};
