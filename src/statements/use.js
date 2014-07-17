/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.USE = function(walker) {
	return function() {
		var dbName;
		walker.someType(WORD_OR_STRING, function(token) {
			dbName = token[0];
		})
		.errorUntil(";")
		.commit(function() {
			SERVER.setCurrentDatabase(dbName);
			walker.onComplete('Database "' + dbName + '" selected.');
		});
	};
};