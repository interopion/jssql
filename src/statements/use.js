STATEMENTS.USE = function(walker, output) {
	return function() {
		var dbName;
		walker.someType(WORD_OR_STRING, function(token) {
			dbName = token[0];
		})
		.errorUntil(";")
		.commit(function() {
			setCurrentDatabase(dbName);
			output.state = STATE_COMPLETE;
		});
	};
};