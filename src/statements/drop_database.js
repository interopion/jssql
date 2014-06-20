STATEMENTS.DROP_DATABASE = function(walker, output) {
	return function() {
		var q = {};
		walker.optional("IF EXISTS", function() {
			q.ifExists = true;
		})
		.someType(WORD_OR_STRING, function(token) {
			q.name = token[0];
		})
		.errorUntil(";")
		.commit(function() {
			SERVER.dropDatabase(q.name, q.ifExists);
			output.state = STATE_COMPLETE;
		});
	};
};