////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                               SQL Parser                                   //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
function SQLParseError(message)
{
	this.name    = "SQLParseError";
	this.message = strf.apply(
		this, 
		arguments.length ? arguments : ["Error while parsing sql query"]
	);
}

SQLParseError.prototype = new Error();
SQLParseError.prototype.constructor = SQLParseError;

function SQLRuntimeError(message)
{
	this.name    = "SQLRuntimeError";
	this.message = strf.apply(
		this, 
		arguments.length ? arguments : ["Error while executing sql query"]
	);
}

SQLParseError.prototype = new Error();
SQLParseError.prototype.constructor = SQLParseError;



function Parser(onComplete, onError)
{
	var parser = this,
		env    = {},
		tokens;

	function parse2(tokens, input) {
		var walker = new Walker(tokens, input);

		walker.onComplete = onComplete || noop;
		walker.onError = onError || defaultErrorHandler;

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