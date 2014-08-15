
STATEMENTS.SOURCE = function(walker) {
	return new Task({
		name : "SOURCE Command",
		execute : function(done, fail) {
			var start = walker.current()[2],
				xhr,
				end,
				url;

			var string = [
				"@" + TOKEN_TYPE_SINGLE_QUOTE_STRING,
				"@" + TOKEN_TYPE_DOUBLE_QUOTE_STRING,
				"@" + TOKEN_TYPE_BACK_TICK_STRING
			].join("|");

			if (walker.is(string)) {
				url = walker.get().trim();
				walker.forward().errorUntil(";");
			} else {
				start = walker.current()[2];
				walker.nextUntil(";");
				end = walker.current()[2];
				url = walker._input.substring(start, end).trim();
			}
			console.log(url);

			walker.commit(function() {
				
				if (url) {
					xhr = new XMLHttpRequest();
					xhr.open("GET", url, true);
					xhr.onreadystatechange = function() {
						if (xhr.readyState == 4) {
							if (xhr.status == 200 || xhr.status == 304) {
								var queries = getQueries(xhr.responseText),
									len = queries.length;
								query(queries, function(result, idx) {
									if (idx === len - 1) {
										done(strf(
											'%s queries executed successfuly from file "%s"',
											len,
											url
										));
									}
								}, function(e, idx) {
									fail(e + " (query: " + queries[idx].sql + ")");
								});
							} else {
								fail(xhr.statusText);
							}
						}
					};
					xhr.send(null);
				}
			});
		},
		undo : function(done, fail) {
			console.warn("The SOURCE command cannot be undone!");
			done();
		}
	});
};