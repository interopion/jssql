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

	function undo(next) {
		if (lastUsedDB) {
			SERVER.setCurrentDatabase(lastUsedDB.name);
			next(null, 'Current database restored to "' + lastUsedDB.name + '".');
		} else {
			next();
		}
	}
	
	return new Task({
		name : "Use Database",
		execute : function(next) {
			var dbName;
			walker.someType(WORD_OR_STRING, function(token) {
				dbName = token[0];
			})
			.errorUntil(";")
			.commit(function() {
				var err = null, out = null;
				try {
					SERVER.setCurrentDatabase(dbName);
					lastUsedDB = SERVER.getCurrentDatabase();
					out = 'Database "' + dbName + '" selected.';
				} catch (ex) {
					err = ex;
				}
				next(err, out);
			});
		},
		undo : undo
	});
};