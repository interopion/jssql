/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.DROP_DATABASE = function(walker) {
	return new Task({
		name : "Drop Database",
		execute : function(done, fail) {
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
				done('Database "' + q.name + '" deleted.');
			});
		},
		undo : function(done, fail) {
			fail ("undo is not implemented for the DROP DATABASE queries");
		}
	});
};