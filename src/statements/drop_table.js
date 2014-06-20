STATEMENTS.DROP_TABLE = function(walker) {
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
				if (ifExists) {
					return walker.onComplete(
						'Table "' + database.name + '.' + tableName + '" does not exist.'
					);
				}
				
				throw new SQLRuntimeError(
					'No such table "%s" in databse "%s"',
					tableName,
					database.name
				);
			}
			
			table.drop(function() {
				walker.onComplete(
					'Table "' + database.name + '.' + table.name + '" deleted.'
				);
			}, walker.onError);
		});
	};
};