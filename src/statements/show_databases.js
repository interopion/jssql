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
		execute : function(done, fail) {
			walker.errorUntil(";").commit(function() {
				done({
					cols : ["Databases"],
					rows : keys(SERVER.databases).map(makeArray)
				});
			});
		},
		undo : function(done, fail) {
			done(); // Nothing to undo here...
		}
	});
};