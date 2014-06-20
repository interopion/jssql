STATEMENTS.DROP_TABLE = function(walker, output) {
	var ifExists = false,
		tableName,
		dbName;
	
	return function() {
		
		walker.optional("IF EXISTS", function() {
			ifExists = true;
		})
		.someType(WORD_OR_STRING, function(token) {
			tableName = token[0];
		})
		.optional(".", function() {
			walker.someType(WORD_OR_STRING, function(token) {
				dbName = tableName;
				tableName = token[0];
			});
		})
		.optional("RESTRICT|CASCADE", function() {
			// TODO
		})
		.errorUntil(";")
		.commit(function() {
			var database, table;
			
			if (!dbName) {
				database = CURRENT_DATABASE;
				if (!database) {
					throw new SQLRuntimeError('No database selected.');
				}
			} else {
				database = SERVER.databases[dbName];
				if (!database) {
					throw new SQLRuntimeError(
						'No such database "%s"',
						dbName
					);
				}
			}
			
			table = database.tables[tableName];
			if (!table) {
				throw new SQLRuntimeError(
					'No such table "%s" in databse "%s"',
					tableName,
					dbName
				);
			}
			
			table.drop();
			delete database.tables[tableName];
			output.state = STATE_COMPLETE;
		});
	};
};