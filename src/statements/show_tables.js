/**
 * The syntax is "SHOW tables [FROM|IN databse]". If the [FROM|IN databse] part
 * is missing, the current databse is used.
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 * @throws {SQLRuntimeError} exception - If the databse cannot be resolved
 * @example
 * <pre style="font-family:Menlo, monospace">
 * 
 *     ┌──────┐ ┌──────────┐       
 *   ──┤ SHOW ├─┤  TABLES  ├──┬────────────────────────────────────┬────
 *     └──────┘ └──────────┘  │                                    │
 *                            │     ┌──────┐                       │
 *                            │  ┌──┤ FROM ├──┐                    │
 *                            │  │  └──────┘  │  ┌──────────────┐  │
 *                            └──┤            ├──┤ databse name ├──┘
 *                               │  ┌──────┐  │  └──────────────┘
 *                               └──┤  IN  ├──┘
 *                                  └──────┘
 * </pre>
 */
STATEMENTS.SHOW_TABLES = function(walker) 
{
	return function() 
	{
		var db = SERVER.getCurrentDatabase(), dbName;

		if ( walker.is("FROM|IN") ) 
		{
			walker.forward();
			walker.someType(WORD_OR_STRING, function(token) {
				dbName = token[0];
				db = SERVER.databases[dbName];
			});
		}
		
		walker.nextUntil(";").commit(function() {
			if (!db) 
			{
				if (dbName)
				{
					throw new SQLRuntimeError(
						'No such database "%s"',
						dbName
					);
				}
				else
				{
					throw new SQLRuntimeError('No database selected');
				}
			}

			walker.onComplete({
				cols : ['Tables in database "' + db.name + '"'],
				rows : keys(db.tables).map(makeArray)
			});
		});
	};
};