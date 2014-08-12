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

	function undo(done, fail) {
		if (dbName) {
			SERVER.dropDatabase(dbName, true, done, fail);
		} else {
			done();
		}
	}

	return new Task({
		name : "Create Database",
		execute : function(done, fail) {
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
				q.execute();
				done('Database "' + q.name() + '" created.');
			});
		},
		undo : function(done, fail) {
			undo(done, fail);
		}
	});
};