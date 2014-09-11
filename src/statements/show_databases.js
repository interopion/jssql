/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.SHOW_DATABASES = function(walker) {
	return new Task({
		name : "Show databases",
		execute : function(next) {
			walker.errorUntil(";").commit(function() {
				next(null, {
					cols : ["Databases"],
					rows : keys(walker.server.databases).map(makeArray)
				});
			});
		},
		undo : function(next) {
			next(); // Nothing to undo here...
		}
	});
};