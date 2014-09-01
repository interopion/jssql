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
		execute : function(next) {
			var q = {};
			walker.optional("IF EXISTS", function() {
				q.ifExists = true;
			})
			.someType(WORD_OR_STRING, function(token) {
				q.name = token[0];
			}, "for the database name")
			.errorUntil(";")
			.commit(function() {
				SERVER.dropDatabase(q.name, q.ifExists, function(err) {
					next(err, err ? null : 'Database "' + q.name + '" deleted.');
				});
			});
		},
		undo : function(next) {
			next("undo is not implemented for the DROP DATABASE queries");
		}
	});
};