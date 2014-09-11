/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {Function}
 * @example
 * <pre style="font-family:Menlo, monospace">
 * 
 *     ┌────────┐ ┌──────┐                                ┌──────────────┐  
 *  >──┤ DELETE ├─┤ FROM ├─┬────────────────────────────┬─┤ "table name" ├──┐
 *     └────────┘ └──────┘ │ ┌─────────────────┐  ┌───┐ │ └──────────────┘  │
 *                         └─┤ "Database name" ├──┤ . ├─┘                   │
 *                           └─────────────────┘  └───┘                     │
 *   ┌──────────────────────────────────────────────────────────────────────┘  
 *   │
 *   └─────┬────────────────────────────────┬──────────────────>
 *         │    ┌───────┐    ┌───────┐      │
 *         └────┤ WHERE ├────┤ EXPR. ├──────┘
 *              └───────┘    └───────┘
 *             
 *
 * </pre>
 */
STATEMENTS.DELETE = function(walker) {

	return new Task({
		name : "Delete Query",
		execute : function(next)
		{
			//console.log(walker._input);
			var tableName, dbName, start = 0, end = 0, where = "";

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

			walker.require("FROM");
			
			if ( !walker.forward().is(identifier) )
			{
				throw new SQLParseError(
					'Expecting an identifier for table name before "%s"',
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



			if ( walker.is("WHERE") ) 
			{
				walker.forward();
				start = walker.current()[2];
				end   = start;
				walker.nextUntil(";");
				end   = walker.current()[3];
				where = walker._input.substring(start, end);
			}
			else 
			{
				walker.errorUntil(";");
			}	

			walker.commit(function() {

				var db = dbName ?
						walker.server.getDatabase(dbName) :
						walker.server.getCurrentDatabase(),
					table,
					rows,
					rowIds = [],
					len = 0;

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

				table = db.getTable(tableName);
				rows  = table.rows;

				//console.log(
				//	" dbName   : ", db.name   , "\n",
				//	"tableName: ", table.name, "\n",
				//	"where    : ", where, "\n",
				//	"rows     : ", rows
				//);
				
				each(rows, function(row, rowId, allRows) {//console.log(where, row.toJSON(true));
					if ( !where || executeCondition( where, row.toJSON("mixed") ) )
					{
						len = rowIds.push(row);
					}
				});
				//console.log(2, rowIds, rows);

				if ( len ) 
				{
					table.deleteRows(rowIds, function(err) {
						next(err, err ? null : len + " rows deleted");
					});
				}
				else
				{
					next(null, len + " rows deleted");
				}
			});
		},
		undo : function(next) {
			if (walker.server.options.debug)
				console.warn("undo not implemented for DELETE queries!");
			next();
		}
	});
};
