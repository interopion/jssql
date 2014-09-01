/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.CREATE_DATABASE = function(walker) {

	// remember the databse name here so that we can undo
	var dbName;

	function undo(next) {
		if (dbName) {
			SERVER.dropDatabase(dbName, true, next);
		} else {
			next();
		}
	}

	return new Task({
		name : "Create Database",
		execute : function(next) {
			var q = new CreateDatabaseQuery();

			// Make sure to reset this in case it stores something from 
			// previous query
			dbName = null;

			walker
			.optional("IF NOT EXISTS", function() {
				q.ifNotExists(true);
			})
			.someType(WORD_OR_STRING, function(token) {
				q.name(token[0]);
			})
			.nextUntil(";")
			.commit(function() {
				dbName = q.name();
				q.execute(function(err) {
					next(err, err ? null : 'Database "' + q.name() + '" created.');
				});
			});
		},
		undo : undo
	});
};