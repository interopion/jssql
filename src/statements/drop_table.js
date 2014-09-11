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
				var database = walker.server.getDatabase(dbName), 
					table    = database.getTable(tableName, !ifExists);
				
				if (!table) {
					return next(null, null);
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