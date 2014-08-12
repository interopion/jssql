/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {Function}
 * @example
 * <pre style="font-family:Menlo, monospace">
 * 
 *                                  ┌──────┐
 *                               ┌──┤ FROM ├──┐
 *     ┌──────┐ ┌───────────┐    │  └──────┘  │  ┌──────────────┐  
 *  >──┤ SHOW ├─┤  COLUMNS  ├────┤            ├──┤ "table name" ├──┐
 *     └──────┘ └───────────┘    │  ┌──────┐  │  └──────────────┘  │
 *                               └──┤  IN  ├──┘                    │
 *                                  └──────┘                       │
 *   ┌─────────────────────────────────────────────────────────────┘  
 *   │
 *   └─────┬───────────────────────────────────────┬──────────────────>
 *         │                                       │
 *       ┌─│───────────────────────────────────────│─┐
 *       │ │      ┌──────┐                         │ │
 *       │ │   ┌──┤ FROM ├──┐                      │ │
 *       │ │   │  └──────┘  │  ┌────────────────┐  │ │ // If this is omitted, then the query is
 *       │ └───┤            ├──┤ "databse name" ├──┘ │ // executed against the current database
 *       │     │  ┌──────┐  │  └────────────────┘    │ // (if any)
 *       │     └──┤  IN  ├──┘                        │
 *       │        └──────┘                           │
 *       └───────────────────────────────────────────┘
 * </pre>
 */
STATEMENTS.SHOW_COLUMNS = function(walker) {
	
	function getExtrasList(meta) {
		var out = [];
		if (meta.unsigned) {
			out.push("UNSIGNED");
		}
		if (meta.zerofill) {
			out.push("ZEROFILL");
		}
		if (meta.autoIncrement) {
			out.push("AUTO INCREMENT");
		}
		return out.join(", ");
	}
			
	return new Task({
		name : "Show columns",
		execute : function(done, fail) {
			var dbName, tableName;

			walker.pick({
				"FROM|IN" : function() {
					walker.someType(WORD_OR_STRING, function(token) {
						tableName = token[0];
					});
				}
			});

			if ( walker.is("FROM|IN") )
			{
				walker.forward().someType(WORD_OR_STRING, function(token) {
					dbName = token[0];
				});
			}

			walker.nextUntil(";"); // TODO: Implement LIKE here
			
			walker.commit(function() {
				var database = dbName ? 
						SERVER.databases[dbName] : 
						SERVER.getCurrentDatabase(), 
					table;
				
				if (!database) {
					if ( dbName ) {
						return fail(new SQLRuntimeError('No such database "%s"', dbName));
					} else {
						return fail(new SQLRuntimeError('No database selected'));
					}
				}
				
				table = database.tables[tableName];

				if (!table)
				{
					return fail(new SQLRuntimeError(
						'No such table "%s" in databse "%s"',
						tableName,
						database.name
					));
				}
				
				var result = {
					cols : ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'],
					rows : []
				};
				
				each(table.cols, function(col) {
					var meta = col.toJSON(); //console.log("meta: ", meta);
					result.rows.push([
						meta.name,
						col.typeToSQL(),
						meta.nullable ? "YES" : "NO",
						meta.key,
						typeof meta.defaultValue == "string" ? 
							quote(meta.defaultValue, "'") : 
							meta.defaultValue === undefined ?
								'none' : 
								meta.defaultValue,
						getExtrasList(meta)
					]);
				});	

				done(result);
			});
		},
		undo : function(done, fail) {
			done(); // Nothing to undo here....
		}
	});
};