STATEMENTS.CREATE_DATABASE = function(walker, output) {
	return function() {
		var q = new CreateDatabaseQuery();
		walker
		.optional("IF NOT EXISTS", function() {
			q.ifNotExists(true);
		})
		.someType(WORD_OR_STRING, function(token) {
			q.name(token[0]);
		})
		.nextUntil(";")
		.commit(function() {
			q.execute();
			output.state = STATE_COMPLETE;
		});
	};
};