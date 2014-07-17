/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.SHOW_TABLES = function(walker) {
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
					walker.onComplete({
						cols : ['Tables in database "' + db + '"'],
						rows : keys(database.tables).map(makeArray)
					});
				});
			}
		});
	};
};