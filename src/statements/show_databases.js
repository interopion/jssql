STATEMENTS.SHOW_DATABASES = function(walker) {
	return function() {
		walker.errorUntil(";").commit(function() {
			walker.onComplete({
				head : ["Databases"],
				rows : keys(SERVER.databases)
			});
		});
	};
};