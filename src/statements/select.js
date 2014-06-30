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

	/**
	 * Parses a table field reference witch might be defined as "fieldName" or 
	 * as "tableName.fieldName", or as "databaseName.tableName.fieldName". This 
	 * function does NOT try to evaluate the result to real field object. 
	 * Instead it just returns an object with "field", "table" and "database" 
	 * properties (the "database" and "table" will be null if not defined). 
	 * @return {Object}
	 * @throws {SQLParseError} if the input cannot be parsed correctly
	 * @param {Object} options Optional configuration object with the following
	 *     boolean properties (each of which defaults to false):
	 * 	   @includeAlias  If true, the function will also look for an
	 *     				  alias after the field declaration
	 *     @allowAll      If true, the function will also match "*" as field name
	 *     @allowIndexes  If true, the function will also match integers as 
	 *                    field names. This might be used in ORDER BY clause for 
	 *                    example
	 *     @includeDB     If true, the fields can be defined as db.table.field
	 *                    instead of just field or table.field
	 */
	function walkFieldRef(options) 
	{
		options = options || {};

		var out = {
			database : null, 
			table    : null,
			field    : null
		};

		var name = identifier;
		if (options.allowAll) {
			name += "|*";
		}
		if (options.allowIndexes) {
			name += "|@" + TOKEN_TYPE_NUMBER;
		}

		if (options.includeAlias) {
			out.alias = null;
		}

		walker.require(name);
		out.field = walker.get();
		walker.forward();
		if (walker.is(".")) {
			walker.forward().require(name);
			out.table = out.field;
			out.field = walker.get();
			walker.forward();
			if (options.includeDB && walker.is(".")) {
				walker.forward().require(name);
				out.database = out.table;
				out.table    = out.field;
				out.field    = walker.get();
				walker.forward();
			}
		}

		// now check what we have so far
		if (isNumeric(out.field)) {
			out.field = intVal(out.field);
			if (out.field < 0) {
				throw new SQLParseError('Negative column index is not allowed.');	
			}
		} else if (!out.field) {
			throw new SQLParseError('Expecting a field name');
		}

		if (out.table == "*") {
			throw new SQLParseError('You cannot use "*" as table name');
		} else if (isNumeric(out.table)) {
			throw new SQLParseError('You cannot use number as table name');
		}

		if (out.database == "*") {
			throw new SQLParseError('You cannot use "*" as database name');
		} else if (isNumeric(out.database)) {
			throw new SQLParseError('You cannot use number as database name');
		}

		// now check for an alias or just continue
		if (options.includeAlias) {
			if (walker.is(identifier)) { 
				if (walker.is("AS")) {
					walker.forward();
					walker.someType(WORD_OR_STRING, function(tok) {
						out.alias = tok[0];
					});
				}
				else if (walker.is("FROM|WHERE|GROUP|ORDER|LIMIT|OFFSET")) {
					
				}
				else {
					out.alias = walker.current()[0];
					walker.forward();
				}
			}
		}

		return out;
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
	function tableRef() 
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
			}, "for table name");
		});

		if (walker.is(identifier)) {
			if (walker.is("AS")) {
				walker.forward();
				walker.someType(WORD_OR_STRING, function(tok) {
					out.alias = tok[0];
				}, "for table alias");
			}
			else if (walker.is("WHERE|GROUP|ORDER|LIMIT|OFFSET")) {
				
			}
			else {
				out.alias = walker.current()[0];
				walker.forward();
			}
		}

		return out;
	}

	/**
	 * Collects the field references from the statement using the walkFieldRef
	 * function.
	 * @return {void}
	 */
	function collectFieldRefs(fields) 
	{
		var out = walkFieldRef({
			includeAlias : true, 
			allowAll     : true, 
			allowIndexes : true,
			includeDB    : true
		});

		fields.push(out);

		if (walker.is(",")) {
			walker.forward();
			collectFieldRefs(fields);
		}
	}

	function collectTableRefs(tables)
	{
		var table = tableRef();
		tables.push(table);
		if (walker.is(",")) {
			walker.forward();
			collectTableRefs(tables);
		}
	}

	function collectNextOrderingTerm()
	{
		var orderBy = [],
			term = {
				expression : [],
				direction  : "ASC"
			};

		walker.nextUntil("ASC|DESC|,|LIMIT|OFFSET|;", function(tok) {
			term.expression.push(tok[0]);
		});

		term.expression = term.expression.join(" ");
		
		if ( walker.is("ASC|DESC") ) {
			term.direction = walker.get().toUpperCase();
			walker.forward();
		}

		orderBy.push(term);

		if ( walker.is(",") ) {
			walker.forward();
			orderBy = orderBy.concat(collectNextOrderingTerm());
		}

		return orderBy;
	}

	function walkOrderBy()
	{
		var orderBy = [];

		if (walker.is("ORDER BY")) {
			walker.forward(2);
			orderBy = collectNextOrderingTerm();
		}

		return orderBy;
	}

	function walkLimitAndOffset()
	{
		var limit  = 0,
			offset = 0;

		if (walker.is("LIMIT")) {
			walker.forward();

			if ( !walker.is("@" + TOKEN_TYPE_NUMBER) ) {
				throw new SQLParseError(
					"Expecting a number for the LIMIT clause"
				);
			}

			limit = intVal(walker.get());
			walker.forward();

			if (walker.is(",")) {
				if (!walker.forward().is("@" + TOKEN_TYPE_NUMBER)) {
					throw new SQLParseError(
						"Expecting a number for the offset part of the LIMIT clause"
					);
				}
				offset = intVal(walker.get());
				walker.forward();
			}
		}

		if (walker.is("OFFSET")) {console.log(walker._tokens[walker._pos]);
			walker.forward();
			if (!walker.is("@" + TOKEN_TYPE_NUMBER)) {
				//console.log(walker._tokens[walker._pos]);
				throw new SQLParseError(
					"Expecting a number for the OFFSET clause"
				);
			}
			offset = intVal(walker.get());
			walker.forward();
		}
		console.warn(walker._input, limit, offset);
		return {
			limit : limit,
			offset: offset
		};
	}

	function walkJoinConstraint()
	{
		if (walker.is("ON")) {

		} else if (walker.is("USING")) {

		}
	}

	function walkJoinOperator()
	{
		var join = [], l;

		if (walker.is("NATURAL")) {
			l = join.push("NATURAL");
			walker.forward();
		}

		if (walker.is("LEFT OUTER")) {
			l = join.push("LEFT OUTER");
			walker.forward(2);
		} else if (walker.is("LEFT|INNER|CROSS")) {
			l = join.push(walker.get().toUpperCase());
			walker.forward();
		}

		if (l) {
			join.push("JOIN");
		}

		return join.join(" ");
	}

	/**
	 * Executes the SELECT query and returns the result rows.
	 */
	function execute(query)
	{
		var rows         = [],
			cols         = [],
			tables       = {},
			columns      = {},
			colMap       = [],
			tablesLength = query.tables.length,
			fieldsLength = query.fields.length,
			rowsLength   = 0,
			colName,
			rowIndex,
			tableIndex,
			tableRow,
			table,
			rowId,
			row,
			col,
			tmp,
			i, y, l, j;

		// Populate the tables object with Table references --------------------
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

		// Expand "*" ----------------------------------------------------------
		l = 0;
		for ( i = 0; i < fieldsLength; i++ )
		{
			col = query.fields[i];

			if (col.field == "*") {//debugger;
				var f = [];

				if (col.table) {
					j = 0;
					for ( colName in tables[col.table].cols ) {
						query.fields.splice(i++, ++j === 1 ? 1 : 0, {
							field : colName,
							alias : colName,
							table : col.table
						});
						fieldsLength++;
					}					
				} else {
					j = 0;
					for ( y = 0; y < tablesLength; y++ ) {
						for ( colName in tables[y].cols ) {
							query.fields.splice(i++, ++j === 1 ? 1 : 0, {
								field : colName,
								alias : colName,
								table : tables[y].name
							});
							fieldsLength++;
						}
					}
				}
			}
		}
		

		// Build the colMap ----------------------------------------------------
		l = 0;
		for ( i = 0; i < tablesLength; i++ ) 
		{
			table = tables[i];

			for ( colName in table.cols ) 
			{
				col = table.cols[colName];
				colMap[l] = 0;
				for ( y = 0; y < query.fields.length; y++ )
				{
					var fld = query.fields[y];
					if (fld.field == col.name && (!fld.table || fld.table == table.name)) {
						cols.push(fld.field);
						colMap[l] = 1;
					}
				}
				l++;
			}
		}
		
		// Populate the columns object -----------------------------------------
		/*for ( i = 0; i < fieldsLength; i++ ) 
		{
			col = query.fields[i];
			
			if (col.table) {
				if (!tables.hasOwnProperty(col.table)) {
					throw new SQLParseError(
						'The table "%s" for column "%s" is not included at ' + 
						'the FROM clause',
						col.table,
						col.field
					);
				}
			}

			// Expand "*"
			if (col.field == "*") {
				if (col.table) {
					for ( colName in tables[col.table].cols ) {
						tmp = tables[col.table].cols[colName];
						columns[i] = columns[colName] = tmp;
						cols.push(colName);
					}					
				} else {
					for ( y = 0; y < tablesLength; y++ ) {
						for ( colName in tables[y].cols ) {
							tmp = tables[y].cols[colName];
							columns[i] = columns[colName] = tmp;
							cols.push(colName);
						}
					}
				}
				continue;
			}


			//if (col.table) {
			//	if (col.alias in columns) {
			//		throw new SQLParseError(
			//			'Column "%s" is ambiguous',
			//			col.alias
			//		);
			//	}
			//}

			if (!col.alias) {
				col.alias = col.field;
			}

			columns[i] = columns[col.alias] = col;
			cols.push(col.alias);
		}*/

		// Collect all rows from all the tables --------------------------------
		var _tables = [];
		for ( tableIndex = 0; tableIndex < tablesLength; tableIndex++ )
		{
			_tables.push(tables[tableIndex]);
		}
		rows = crossJoin(_tables);

		// orderBy -------------------------------------------------------------
		if ( query.orderBy ) {
			rows.sort(function(a, b) {
				var out = 0, col, valA, valB, i, term; 
				for ( i = 0; i < query.orderBy.length; i++ ) {
					term = query.orderBy[i];
					col  = term.expression;
					//debugger;
					if (!isNumeric(col)) {
						col = cols.indexOf(col);
					}
					
					col = intVal(col);

					valA = a[col];
					valB = b[col];

					if (valA > valB) {
						out += term.direction == "ASC" ? 1 : -1;
					}
					else if (valA < valB) {
						out += term.direction == "ASC" ? -1 : 1;
					}

					if (out !== 0)
						break;
				}
				return out;
			});
		}

		var limit  = query.bounds.limit,
			offset = query.bounds.offset,
			len    = rows.length;

		if (offset < 0) {
			offset = len + offset;
		}

		l = rows.length;
		var rows2 = [];
		console.log(limit, offset);
		for ( i = 0; i < l; i++ ) {
			
			// Apply OFFSET
			// -----------------------------------------------------------------
			if (i < offset) {
				continue;
			}

			// Apply LIMIT -----------------------------------------------------
			if (limit && i >= offset + limit) {
				continue;
			}

			// Exclude unused columns
			// -----------------------------------------------------------------
			row = rows[i];
			tmp = [];

			for ( y = 0; y < row.length; y++ ) {
				if (colMap[y])
					tmp.push(row[y]);
			}

			rows2.push(tmp);
		}

		//console.log("tables: ", tables, rows);
		return {
			cols : cols,
			rows : rows2
		};
	}

	return function() {
		
		var query = {
			fields : [],
			tables : []
		};

		collectFieldRefs(query.fields);

		
		//console.log("current: ", walker.current()[0]);
		walker.pick({
			"FROM" : function() {//console.log("current: ", walker.current()[0]);
				collectTableRefs(query.tables);
			}
		});

		query.orderBy = walkOrderBy();
		query.bounds = walkLimitAndOffset();
		//console.log("query: ", query);
		
		// table -------------------------------------------------------
		var //tbl   = tableRef(),
			table = getTable(query.tables[0].table, query.tables[0].database);
		
		walker
		.errorUntil(";")
		.commit(function() {
			//execute(query);
			
			var result = execute(query);
			console.log("query: ", query, "result: ", result);

			walker.onComplete({
				cols : result.cols,
				rows : result.rows
			});
		});
	};
};