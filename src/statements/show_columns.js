/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 @example
 * <pre style="font-family:Menlo, monospace">
 * 
 *                                  ┌──────┐
 *                               ┌──┤ FROM ├──┐
 *     ┌──────┐ ┌──────────┐     │  └──────┘  │  ┌────────────┐  
 *  >──┤ SHOW ├─┤  TABLES  ├─────┤            ├──┤ table name ├──┐
 *     └──────┘ └──────────┘     │  ┌──────┐  │  └────────────┘  │
 *                               └──┤  IN  ├──┘                  │
 *                                  └──────┘                     │
 *   ┌───────────────────────────────────────────────────────────┘  
 *   │
 *   └─────┬───────────────────────────────────────┬──────────────────>
 *         │        ┌──────┐                       │
 *         │     ┌──┤ FROM ├──┐                    │
 *         │     │  └──────┘  │  ┌──────────────┐  │
 *         └─────┤            ├──┤ databse name ├──┘
 *               │  ┌──────┐  │  └──────────────┘
 *               └──┤  IN  ├──┘
 *                  └──────┘
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
			
	return function() {
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
			walker.forward();
			walker.someType(WORD_OR_STRING, function(token) {
				dbName = token[0];
			});
		}

		walker.nextUntil(";"); // TODO: Implement LIKE here
		
		walker.commit(function() {
			var database = dbName ? 
					SERVER.databases[dbName] : 
					SERVER.getCurrentDatabase(), 
				table;
			
			if (!database) 
			{
				if ( dbName )
				{
					throw new SQLRuntimeError('No such database "%s"', dbName);
				}
				else 
				{
					throw new SQLRuntimeError('No database selected');
				}
			}
			
			table = database.tables[tableName];

			if (!table)
			{
				throw new SQLRuntimeError(
					'No such table "%s" in databse "%s"',
					tableName,
					database.name
				);
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

			walker.onComplete(result);
		});
	};
};