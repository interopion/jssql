STATEMENTS.SHOW_TABLES = function(walker, output) {
	return function() {
		walker.pick({
			"FROM|IN" : function() {
				var db;
				walker.someType(WORD_OR_STRING, function(token) {
					db = token[0];
				})
				.nextUntil(";")
				.commit(function() {
					var database = SERVER.databases[db];
					if (!database) {
						throw new SQLRuntimeError(
							'No such database "%s"',
							db
						);
					}
					output.state = STATE_COMPLETE;
					output.result = {
						head : ['Tables in database "' + db + '"'],
						rows : keys(database.tables)
					};
				});
			}
		});
	};
};