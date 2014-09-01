/**
 * The syntax is "SHOW tables [FROM|IN databse]". If the [FROM|IN databse] part
 * is missing, the current databse is used.
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {Function}
 * @throws {SQLRuntimeError} exception - If the databse cannot be resolved
 * @example
 * <pre style="font-family:Menlo, monospace">
 * 
 *     ┌──────┐ ┌──────────┐       
 *  >──┤ SHOW ├─┤  TABLES  ├───┬──────────────────────────────────────┬────>
 *     └──────┘ └──────────┘ ┌─│──────────────────────────────────────│─┐
 *                           │ │     ┌──────┐                         │ │
 *                           │ │  ┌──┤ FROM ├──┐                      │ │
 *                           │ │  │  └──────┘  │  ┌────────────────┐  │ │
 *                           │ └──┤            ├──┤ "databse name" ├──┘ │
 *                           │    │  ┌──────┐  │  └────────────────┘    │
 *                           │    └──┤  IN  ├──┘                        │
 *                           │       └──────┘                           │
 *                           └──────────────────────────────────────────┘
 *                           // If this is omitted, then the query is
 *                           // executed against the current database
 *                           // (if any)
 *                           
 * </pre>
 */
STATEMENTS.SHOW_TABLES = function(walker) 
{
	return new Task({
		name : "Show tables",
		execute : function(next) {
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
				if (!db) {
					if (dbName) {
						next(new SQLRuntimeError('No such database "%s"', dbName), null);
					} else {
						next(new SQLRuntimeError('No database selected'), null);
					}
				} else {
					next(null, {
						cols : ['Tables in database "' + db.name + '"'],
						rows : keys(db.tables).map(makeArray)
					});
				}
			});
		},
		undo : function(next) {
			next();// Nothing to undo here...
		}
	});
};