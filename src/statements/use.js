/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.USE = function(walker) {
	
	// Remember the last used DB here so that we can undo
	var lastUsedDB = SERVER.getCurrentDatabase();

	function undo(done, fail) {
		if (lastUsedDB) {
			SERVER.setCurrentDatabase(lastUsedDB.name);
			done('Current database restored to "' + lastUsedDB.name + '".');
		} else {
			done();
		}
	}
	
	return new Task({
		name : "Use Database",
		execute : function(done, fail) {
			var dbName;
			walker.someType(WORD_OR_STRING, function(token) {
				dbName = token[0];
			})
			.errorUntil(";")
			.commit(function() {
				try {
					SERVER.setCurrentDatabase(dbName);
					lastUsedDB = SERVER.getCurrentDatabase();
					done('Database "' + dbName + '" selected.');
				} catch (err) {
					fail(err);
				}
			});
		},
		undo : undo
	});
};