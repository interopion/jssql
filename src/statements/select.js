STATEMENTS.SELECT = function(walker) {
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
					//console.log(table);
					walker.onComplete({
						head : table._col_seq,
						rows : table.rows
					});
				});
			}
		});
	};
};