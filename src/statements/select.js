STATEMENTS.SELECT = function(walker) {

	/**
	 * This will match any string (in any quotes) or just a word as unquoted 
	 * name.
	 * @var string
	 */ 
	var identifier = [
		"@" + TOKEN_TYPE_WORD,
		"@" + TOKEN_TYPE_SINGLE_QUOTE_STRING,
		"@" + TOKEN_TYPE_DOUBLE_QUOTE_STRING,
		"@" + TOKEN_TYPE_BACK_TICK_STRING
	].join("|");

	/**
	 * This will match any identifier but also the "*" symbol.
	 * @var string
	 */ 
	var identifierOrAll = "*|" + identifier;

	function walkOrderBy()
	{
		if (walker.is("ORDER BY")) {
			walker.forward(2);
		}
	}

	/**
	 * Parses a table reference witch might be defined as "tableName" or 
	 * as "databaseName.tableName". This function does NOT try to evaluate the
	 * result to real Table object. Instead it just returns an object with 
	 * "table" and "database" properties (the "database" will be null if not 
	 * defined). 
	 * @return {Object}
	 * @throws {SQLParseError} if the input cannot be parsed correctly
	 */
	function tableRef(tables) 
	{
		var out = {
			database : null, 
			table    : null,
			alias    : null
		};

		walker.someType(WORD_OR_STRING, function(token) {
			out.table = token[0];
		}, "for table name")
		.optional(".", function() {
			walker.someType(WORD_OR_STRING, function(token) {
				out.database = out.table;
				out.table    = token[0];
			}, "for database name");
		});

		if (walker.is(identifier)) {
			if (walker.is("AS")) {
				walker.forward();
				walker.someType(WORD_OR_STRING, function(tok) {
					out.alias = tok[0];
				}, "for table alias");
			}
			else if (walker.is("WHERE|GROUP|ORDER|LIMIT")) {
				
			}
			else {
				out.alias = walker.current()[0];
				walker.forward();
			}
		}

		tables.push(out);

		return out;
	}

	/**
	 * Parses a table field reference witch might be defined as "fieldName" or 
	 * as "tableName.fieldName", or as "databaseName.tableName.fieldName". This 
	 * function does NOT try to evaluate the result to real field object. 
	 * Instead it just returns an object with "field", "table" and "database" 
	 * properties (the "database" and "table" will be null if not defined). 
	 * @return {Object}
	 * @throws {SQLParseError} if the input cannot be parsed correctly
	 */
	function fieldRef(fields) 
	{
		var out = {
			database : null, 
			table    : null,
			field    : null,
			alias    : null
		};

		if (walker.is(identifierOrAll)) {
			out.field = walker.current()[0];
			walker.forward();
			if (walker.is(".")) {
				walker.forward();
				if (walker.is(identifierOrAll)) {
					out.table = out.field;
					out.field = walker.current()[0];
					if (walker.forward().is(".")) {
						if (walker.forward().is(identifierOrAll)) {
							out.database = out.table;
							out.table    = out.field;
							out.field    = walker.current()[0];
						} else {
							walker.prev();
						}
					} else {
						walker.prev();
					}
				} else {
					walker.prev();
				}
			}
		}

		// now check what we have so far
		if (!out.field) {
			throw new SQLParseError('Expecting a field name');
		}
		if (out.table == "*") {
			throw new SQLParseError('You cannot use "*" as table name');
		}
		if (out.database == "*") {
			throw new SQLParseError('You cannot use "*" as database name');
		}

		fields.push(out);

		// now check for an alias or just continue
		if (walker.is(identifier)) { 
			if (walker.is("AS")) {
				walker.forward();
				walker.someType(WORD_OR_STRING, function(tok) {
					out.alias = tok[0];
				});
			}
			else if (walker.is("FROM|WHERE|GROUP|ORDER|LIMIT")) {
				
			}
			else {
				out.alias = walker.current()[0];
				walker.forward();
			}
		}

		if (walker.is(",")) {
			walker.forward();
			fieldRef(fields);
		}
	}

	function execute(query)
	{
		var rows   = [],
			tables = {},
			tablesLength = query.tables.length,
			tableIndex,
			table,
			rowId,
			i;

		for ( i = 0; i < tablesLength; i++ ) 
		{
			tables[i] = tables[query.tables[i].table] = getTable(
				query.tables[i].table,
				query.tables[i].database
			);

			if (query.tables[i].alias) {
				tables[query.tables[i].alias] = tables[i];
			}
		}

		for ( tableIndex = 0; tableIndex < tablesLength; tableIndex++ )
		{
			table = tables[tableIndex];
			for (rowId in table.rows)
			{
				rows.push(table.rows[rowId].toArray());
			}
		}

		console.log("tables: ", tables, rows);
		return rows;
	}

	return function() {
		
		var query = {
			fields : [],
			tables : []
		};

		fieldRef(query.fields);

		
		//console.log("current: ", walker.current()[0]);
		walker.pick({
			"FROM" : function() {//console.log("current: ", walker.current()[0]);
				tableRef(query.tables);
			}
		});

		if (walker.is("ORDER BY")) {

		}
		//console.log("query: ", query);
		
		// table -------------------------------------------------------
		var //tbl   = tableRef(),
			table = getTable(query.tables[0].table, query.tables[0].database);
		
		walker.errorUntil(";")
		.commit(function() {
			//execute(query);
			console.log("query: ", query);

			walker.onComplete({
				head : table._col_seq,
				rows : execute(query)//table.rows
			});
		});
	};
};