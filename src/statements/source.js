
STATEMENTS.SOURCE = function(walker) {
	return new Task({
		name : "SOURCE Command",
		execute : function(next) {
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
			
			walker.commit(function() {
				if (!url)
					return next(new SQLParseError("No path specified"), null);

				xhr = new XMLHttpRequest();
				xhr.open("GET", url, true);
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						if (xhr.status == 200 || xhr.status == 304) {
							var queries = getQueries(xhr.responseText),
								len = queries.length;

							walker.server.query(queries, function(err, result, idx) {
								if (err) {
									return next(
										err ? err : new SQLRuntimeError(
											'Error executing query:\n%s',
											queries[idx].sql
										), 
										null
									);
								}

								if (idx === len - 1) {
									walker.server.save(function(err) {
										next(err, err ? null : strf(
											'%s queries executed successfuly from file "%s"',
											len,
											url
										));
									});
								}
							});
						} else {
							next(new SQLRuntimeError(xhr.statusText), null);
						}
					}
				};
				xhr.send(null);
			});
		},
		undo : function(next) {
			if (walker.server.options.debug)
				console.warn("The SOURCE command cannot be undone!");
			next("The SOURCE command cannot be undone!");
		}
	});
};