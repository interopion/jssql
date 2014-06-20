STATEMENTS.DROP_DATABASE = function(walker) {
	return function() {
		var q = {};
		walker.optional("IF EXISTS", function() {
			q.ifExists = true;
		})
		.someType(WORD_OR_STRING, function(token) {
			q.name = token[0];
		}, "for the database name")
		.errorUntil(";")
		.commit(function() {
			SERVER.dropDatabase(q.name, q.ifExists);
			walker.onComplete('Database "' + q.name + '" deleted.');
		});
	};
};