////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                               SQL Parser                                   //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////





function Parser(onComplete, onError)
{
	var parser = this,
		env    = {},
		result = new Result(),
		tokens;

	function parse2(tokens, input) {
		var walker = new Walker(tokens, input),
			queryNum = 1;

		walker.onComplete = function(_result) {
			if (walker.current()) {
				queryNum++;
				start();
			} else {
				result.setData(_result);
				if (onComplete) 
					onComplete(
						queryNum > 1 ? 
							queryNum + ' queries executed successfully.' :
							result
					);
			}
		};

		walker.onError = onError || defaultErrorHandler;

		function start() 
		{
			walker.pick({
				"USE" : STATEMENTS.USE(walker),
				"SHOW" : function() {
					walker.pick({
						"DATABASES|SCHEMAS" : STATEMENTS.SHOW_DATABASES(walker),
						"TABLES"            : STATEMENTS.SHOW_TABLES(walker),
						"COLUMNS"           : STATEMENTS.SHOW_COLUMNS(walker)
					});
				},
				"CREATE" : function() {
					walker.pick({
						"DATABASE|SCHEMA" : STATEMENTS.CREATE_DATABASE(walker),
						"TABLE"           : STATEMENTS.CREATE_TABLE(walker),
						"TEMPORARY TABLE" : STATEMENTS.CREATE_TABLE(walker),
					});
				},
				"DROP" : function() {
					walker.pick({
						"DATABASE|SCHEMA" : STATEMENTS.DROP_DATABASE(walker),
						"TABLE"           : STATEMENTS.DROP_TABLE(walker),
						"TEMPORARY TABLE" : STATEMENTS.DROP_TABLE(walker)
					});
				},
				"INSERT" : STATEMENTS.INSERT(walker),
				"SELECT" : STATEMENTS.SELECT(walker)
			});
		}

		start();
	}

	this.parse = function(input) {
		tokens = getTokens(input,
		{
			skipComments : true,
			skipSpace    : true,
			skipEol      : true,
			//addEOF       : true,
			skipStrQuots : true
		});
		return parse2(tokens, input);
	};
}

function parse( sql )
{
	var parser = new Parser();
	return parser.parse(sql);
}