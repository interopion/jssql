STATEMENTS.USE = function(walker) {
	return function() {
		var dbName;
		walker.someType(WORD_OR_STRING, function(token) {
			dbName = token[0];
		})
		.errorUntil(";")
		.commit(function() {
			SERVER.setCurrentDatabase(dbName);
			walker.onComplete('Database "' + dbName + '" selected.');
		});
	};
};