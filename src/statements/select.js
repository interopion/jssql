STATEMENTS.SELECT = function(walker, output) {
	return function() {
		
		var tableName, dbName, table;
		
		walker.pick({
			"*|ALL" : function() {
				
				walker.pick({
					"FROM" : noop
				})
				
				// table -------------------------------------------------------
				.someType(WORD_OR_STRING, function(token) {
					tableName = token[0];
				})
				.optional(".", function() {
					walker.someType(WORD_OR_STRING, function(token) {
						dbName = tableName;
						tableName = token[0];
					});
				});
				
				table = getTable(tableName, dbName);
				
				walker.errorUntil(";")
				.commit(function() {
					console.log(table);
					output.result = {
						head : table._col_seq,
						rows : table.rows
					};
					output.state = STATE_COMPLETE;
				});
			}
		});
	};
};