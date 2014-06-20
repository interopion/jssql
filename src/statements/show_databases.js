STATEMENTS.SHOW_DATABASES = function(walker, output) {
	return function() {
		walker.errorUntil(";").commit(function() {
			output.state = STATE_COMPLETE;
			output.result = {
				head : ["Databases"],
				rows : keys(SERVER.databases)
			};
		});
	};
};