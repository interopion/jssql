/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.SHOW_DATABASES = function(walker) {
	return function() {
		walker.errorUntil(";").commit(function() {
			walker.onComplete({
				cols : ["Databases"],
				rows : keys(SERVER.databases).map(makeArray)
			});
		});
	};
};