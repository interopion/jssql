/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.DROP_TABLE = function(walker) {
	var ifExists = false,
		tableName,
		dbName;
	
	return new Task({
		name : "Drop Table",
		execute : function(next) {
			
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
						return next(
							null,
							'Table "' + database.name + '.' + tableName + 
							'" does not exist.'
						);
					}
					
					return next(new SQLRuntimeError(
						'No such table "%s" in databse "%s"',
						tableName,
						database.name
					), null);
				}
				
				table.drop(function(err) {
					if (err)
						return next(err, null);
					
					next(
						null,
						'Table "' + database.name + '.' + table.name + '" deleted.'
					);
				});
			});
		},
		undo : function(next) {
			next(null, "undo is not implemented for the DROP TABLE queries");
		}
	});
};