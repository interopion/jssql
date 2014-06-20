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



function Parser()
{
	var parser = this,
		env    = {},
		tokens;

	function parse2(tokens, input) {
		var walker  = new Walker(tokens, input),
			output  = {
				state  : STATE_WAITING,
				result : null
			};

		function walk_createTable(temporary)
		{
		    var q = new CreateTableQuery();
		    q.temporary(!!temporary);
    		
    		walker
    		.optional("IF NOT EXISTS", function() {
    			q.ifNotExists(true);
    		})
    		.someType(WORD_OR_STRING, function(token) {
				q.name(token[0]);
			})
			.optional("(", function() {
				walk_createTableColumns(q);
			})
			.nextUntil(";")
			.commit(function() {
				q.execute();
				state = STATE_COMPLETE;
			});
		}
		
		function walk_columnTypeParams(type)
		{
			walker.someType(NUMBER_OR_STRING, function(token) {
				type.params.push(token[0]);
			});
			
			walker.pick({
				"," : function() { walk_columnTypeParams(type); },
				")" : noop
			});
		}
		
		function walk_createTableColumns(q)
		{
			var col = {};
			walker.someType(WORD_OR_STRING, function(token) {
				col.name = token[0];
			})
			.any(DATA_TYPES, function(token) {
				var type = {
					name : token[0],
					params : []
				};
				
				walker.optional("(", function() { 
					walk_columnTypeParams(type);
				});
				
				col.type = type;
				
				walker.optional([
					{
						"NOT NULL" : function() {
							col.nullable = false;
						}, 
						"NULL" : function() {
							col.nullable = true;
						}
					},
					{
						"AUTO_INCREMENT" : function() {
							col.autoIncrement = true;
						}
					},
					{
						"PRIMARY KEY" : function() {
							col.key = "PRIMARY";
						},
						"UNIQUE KEY" : function() {
							col.key = "UNIQUE";
						},
						"UNIQUE" : function() {
							col.key = "UNIQUE";
						},
						"KEY" : function() {
							col.key = "INDEX";
						}
					},
					{
						"ZEROFILL" : function() {
							col.zerofill = true;
						}
					},
					{
						"UNSIGNED" : function() {
							col.unsigned = true;
						}
					},
					{
						"DEFAULT" : function() {
							walker.someType(WORD_OR_STRING, function(token) {
								col.defaultValue = token[0];
							});
						}
					}
				]);
				
			}, function(t) {
				throw new SQLParseError( 
					'Expecting data type for column "%s" (%s).', 
					col.name,
					prettyList(DATA_TYPES) 
				);
			})
			.pick({
				"," : function() {
					q.columns.push(col);
					walk_createTableColumns(q);
				},
				")" : function() {
					q.columns.push(col);//console.dir(columns);
				}
			});
		}

		walker.pick({
			"USE" : STATEMENTS.USE(walker, output),
			"SHOW" : function() {
				walker.pick({
					"DATABASES|SCHEMAS" : STATEMENTS.SHOW_DATABASES(walker, output),
					"TABLES"            : STATEMENTS.SHOW_TABLES(walker, output),
					"COLUMNS"           : STATEMENTS.SHOW_COLUMNS(walker, output)
				});
			},
			"CREATE" : function() {
				walker.pick({
					"DATABASE|SCHEMA" : STATEMENTS.CREATE_DATABASE(walker, output),
					"TABLE"           : STATEMENTS.CREATE_TABLE(walker, output),
					"TEMPORARY TABLE" : STATEMENTS.CREATE_TABLE(walker, output),
				});
			},
			"DROP" : function() {
				walker.pick({
					"DATABASE|SCHEMA" : STATEMENTS.DROP_DATABASE(walker, output),
					"TABLE"           : STATEMENTS.DROP_TABLE(walker, output),
					"TEMPORARY TABLE" : STATEMENTS.DROP_TABLE(walker, output)
				});
			},
			"INSERT" : STATEMENTS.INSERT(walker, output),
			"SELECT" : STATEMENTS.SELECT(walker, output)
		});

		return output;
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