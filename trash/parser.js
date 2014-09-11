

/**
 * Executes the given SQL query and invokes the callback function which has the
 * "error-first" signature "function(error, result, queryIndex)".
 * @param {String} sql The SQL query (or multiple queries as string or as array)
 *//*
function query2(sql, callback) 
{
	query(SERVER, sql, function(result, idx) {
		callback(null, result, idx);
	}, function(err, idx) {
		var error = err && err instanceof Error ?
			err : 
			new Error(String(err || "Unknown error"));
		callback(error, null, idx);
	});
}

function query(SERVER, sql, onSuccess, onError) 
{
	var 

	// First we need to split the SQL into queries because the behavior is
	// very different for single vs multiple queries
	queries = sql instanceof QueryList ? sql : getQueries(sql),

	// The number of SQL queries
	len = queries.length,

	// The current query (inside iteration)
	currentQuery = null,

	// Just an iterator variable
	i = 0;

	//console.log("queries:");console.dir(queries);

	function onResult(result, queryIndex)
	{
		if (result !== undefined) {
			onSuccess(result, queryIndex || i);
		}
	}

	function onFailure(e, i)
	{
		(onError || defaultErrorHandler)(
			e && e instanceof Error ? 
				e : 
				new Error(String(e || "Unknown error")),
			i
		);
	}

	function q(name, walker, queryIndex, next)
	{
		return function() {
			var fn = STATEMENTS[name],
				tx = SERVER.getTransaction(),
				result = new Result(),
				task;
			
			if (tx) 
			{
				tx.add(Transaction.createTask({
					name : name,
					execute : function(next) {
						var _result = new Result(), _task;
						try {
							_task = fn(walker);
							_task.execute(function(err, res) {
								if (err) {
									_task.undo(function() {
										next(err);
									});
								} else {
									_result.setData(res);
									onResult(_result, queryIndex);
									next();
								}
							});
						} catch (ex) {
							next(ex);
						}
					},
					undo : function(done, fail) {
						done();
					}
				}));

				result.setData(name + " query added to the transaction");
				onResult(result, queryIndex);
				next();
			}
			else
			{
				try {
					task = fn(walker);
					task.execute(
						function(err, r) {
							if (err) {
								onFailure(err, queryIndex);
								task.undo(noop, noop);
							} else {
								result.setData(r);
								onResult(result, queryIndex);
								next();
							}
						}
					);
				} catch (err) {
					onFailure(err, queryIndex);
				}
			}
		};
	}

	// Iterate over the queries
	// -------------------------------------------------------------------------
	function handleQueryAt(index) 
	{
		var currentQuery = queries[index];

		// All done already
		if (!currentQuery) 
			return;

		var next = function() {
			handleQueryAt(index + 1);
		};

		// Each query has it's own walker
		var walker = new Walker(currentQuery.tokens, currentQuery.sql);

		walker.pick({
				
			// The transaction control statements ------------------------------
			"BEGIN" : q("BEGIN", walker, index, next),

			"COMMIT|END" : function() {
				var tx = SERVER.getTransaction(), result;

				if (!tx) {
					onFailure("There is no transaction to commit", index);
					return;
				}

				result = new Result();

				if (tx.isEmpty()) {
					STATEMENTS.COMMIT(walker).execute(noop, onFailure);
					result.setData("Empty transaction committed");
					onResult(result, index);
					next();
				} else {
					result.setData("Transaction committed");
					onResult(result, index);
					tx.one("complete", function() {
						result.setData("Transaction complete");
						onResult(result, index);
						setTimeout(next, 0);
					});
					tx.one("rollback", function(err) {
						onFailure(
							"Transaction rolled back!" + 
							(err ? "\n" + err : ""), 
							index
						);
						setTimeout(next, 0);
					});
					STATEMENTS.COMMIT(walker).execute(noop, onFailure);
				}
			},

			"ROLLBACK" : function() {
				var tx = SERVER.getTransaction(), result;

				if (!tx) {
					onFailure("There is no transaction to rollback", index);
					return;
				}

				result = new Result();

				if (tx.isEmpty()) {
					STATEMENTS.ROLLBACK(walker).execute(noop, onFailure);
					result.setData("Empty transaction rolled back");
					onResult(result, index);
					next();
				} else {
					tx.one("rollback", function() {
						result.setData("Transaction rolled back!");
						onResult(result, index);
						setTimeout(next, 0);
					});
					STATEMENTS.ROLLBACK(walker).execute(noop, onFailure);
				}
			},

			// All the others --------------------------------------------------
			"SHOW" : function() {
				walker.pick({
					"DATABASES|SCHEMAS" : q("SHOW_DATABASES", walker, index, next),
					"TABLES"            : q("SHOW_TABLES"   , walker, index, next),
					"COLUMNS"           : q("SHOW_COLUMNS"  , walker, index, next)
				});
			},
			"CREATE" : function() {
				walker.pick({
					"DATABASE|SCHEMA" : q("CREATE_DATABASE", walker, index, next),
					"TABLE"           : q("CREATE_TABLE"   , walker, index, next),
					"TEMPORARY TABLE" : q("CREATE_TABLE"   , walker, index, next)
				});
			},
			"DROP" : function() {
				walker.pick({
					"DATABASE|SCHEMA" : q("DROP_DATABASE", walker, index, next),
					"TABLE"           : q("DROP_TABLE"   , walker, index, next),
					"TEMPORARY TABLE" : q("DROP_TABLE"   , walker, index, next)
				});
			},
			
			"SELECT"     : q("SELECT", walker, index, next),
			"USE"        : q("USE"   , walker, index, next),
			"UPDATE"     : q("UPDATE", walker, index, next),
			"INSERT"     : q("INSERT", walker, index, next),
			"DELETE"     : q("DELETE", walker, index, next),
			"SOURCE"     : q("SOURCE", walker, index, next)
		});
	}

	if (len) {
		try {
			handleQueryAt(0);
		} catch (err) {
			onFailure(err);	
		}
	} else {
		onSuccess(new Result("No queries executed"));
	}
}*/

