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
			walker.server.dropDatabase(dbName, true, next);
		} else {
			next();
		}
	}

	return new Task({
		name : "Create Database",
		execute : function(next) {
			var ifNotExists = false, name = "";
			
			// Make sure to reset this in case it stores something from 
			// previous query
			dbName = null;

			walker
			.optional("IF NOT EXISTS", function() {
				ifNotExists = true;
			})
			.someType(WORD_OR_STRING, function(token) {
				name = token[0];
			})
			.nextUntil(";")
			.commit(function() {
				dbName = name;
				walker.server.createDatabase(name, ifNotExists, function(err) {
					next(err, err ? null : 'Database "' + name + '" created.');
				});
			});
		},
		undo : undo
	});
};