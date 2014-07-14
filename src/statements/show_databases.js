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