STATEMENTS.SHOW_COLUMNS = function(walker, output) {
	
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
		})
		.pick({
			"FROM|IN" : function() {
				walker.someType(WORD_OR_STRING, function(token) {
					dbName = token[0];
				});
			}
		})
		.nextUntil(";") // TODO: LIKE
		.commit(function() {
			var database = SERVER.databases[dbName], table;
			if (!database) {
				throw new SQLRuntimeError(
					'No such database "%s"',
					dbName
				);
			}
			
			table = database.tables[tableName];
			if (!table) {
				throw new SQLRuntimeError(
					'No such table "%s" in databse "%s"',
					tableName,
					dbName
				);
			}
			
			output.state = STATE_COMPLETE;
			output.result = {
				head : ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'],
				rows : []
			};
			
			each(table.cols, function(col) {
				var meta = col.toJSON(); console.log("meta: ", meta);
				output.result.rows.push([
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
		});
	};
};