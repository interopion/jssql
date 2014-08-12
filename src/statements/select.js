/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.SELECT = function(walker) {

	/**
	 * This will match any string (in any quotes) or just a word as unquoted 
	 * name.
	 * @type {String}
	 * @inner
	 * @private
	 */ 
	var identifier = [
		"@" + TOKEN_TYPE_WORD,
		"@" + TOKEN_TYPE_SINGLE_QUOTE_STRING,
		"@" + TOKEN_TYPE_DOUBLE_QUOTE_STRING,
		"@" + TOKEN_TYPE_BACK_TICK_STRING
	].join("|");

	/**
	 * This will match any identifier but also the "*" symbol.
	 * @type {String}
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
			field    : null,
			isExpr   : false
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

		try {
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
		} catch(e) {
			
			var start = walker.current()[2],
				end   = walker.current()[3];

			walker.nextUntil(",|AS|FROM|WHERE|GROUP|ORDER|LIMIT|OFFSET|;", function(tok) {
				end = tok[3];
			});

			out.field = walker._input.substring(start, end);
			out.isExpr = true;
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
			allowIndexes : false,//true,
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

		if (walker.is("OFFSET")) {//console.log(walker._tokens[walker._pos]);
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
		//console.warn(walker._input, limit, offset);
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

	function walkWhere()
	{
		var start = 0, end   = 0;

		if ( walker.is("WHERE") ) {
			walker.forward();
			start = walker.current()[2];
			end   = start;
			walker.nextUntil("GROUP|ORDER|LIMIT|OFFSET|;");
			end = walker.current()[2];
		}
			
		return walker._input.substring(start, end);
	}

	function collectQueryTables(query)
	{
		var tablesLength = query.tables.length, tables = {}, i;

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

		return tables;
	}

	function getEnvironment()
	{
		var env = {},
			dbName,
			tableName,
			colName,
			table,
			col,
			db;

		for ( dbName in SERVER.databases )
		{
			db = SERVER.databases[dbName];
			env[dbName] = {};

			for ( tableName in db.tables )
			{
				table = db.tables[tableName];
				env[dbName][tableName] = {};

				for ( colName in table.cols )
				{
					col = table.cols[colName];
					env[dbName][tableName][colName] = col;
				}
			}
		}

		return env;
	}

	
	/**
	 * Executes the SELECT query and returns the result rows.
	 */
	function execute(query)
	{//debugger;
		var ENV          = getEnvironment(),
			rows         = [],
			cols         = [],
			tables       = collectQueryTables(query),
			columns      = {},
			colMap       = [],
			tablesLength = query.tables.length,
			fieldsLength = query.fields.length,
			rowsLength   = 0,
			fieldName,
			colName,
			rowIndex,
			tableIndex,
			tableRow,
			table,
			rowId,
			row,
			col,
			tmp,
			fld,
			db,
			i, y, l, j, f;

		//debugger;
		
		// Compose a row prototype object --------------------------------------
		var _databases = {};
		var _tables = {};
		var rowProto = {};

		function prepareField(fld, i)
		{
			var col = {
				database : fld.database,
				table    : fld.table,
				colIndex : i,
				value    : null,
				name     : fld.field,
				alias    : fld.alias,
				isExpr   : fld.isExpr
			};

			//console.log("fld: ", fld);

			if (fld.table) {
				table = getTable(fld.table.table, fld.table.database);

				if (!_tables.hasOwnProperty(table.name))
					_tables[table.name] = { name : table.name };

				col.table = _tables[table.name];

				if (!_databases.hasOwnProperty(table._db.name))
					_databases[table._db.name] = {};

				_tables[table.name].database = _databases[table._db.name];
				_databases[table._db.name][table.name] = col.table;
				col.database = _databases[table._db.name];
			}

			ENV[fld.field] = null;
			if (fld.alias) {
				ENV[fld.alias] = null;
			}

			rowProto[i] = rowProto[fld.field] = col;
			if (fld.alias) {
				rowProto[fld.alias] = col;
			}

			cols.push(col.alias || col.name);
		}

		y = 0;
		for ( i = 0; i < fieldsLength; i++ )
		{
			fld = query.fields[i];

			if (fld.field == "*") 
			{
				if (fld.table)
				{
					//debugger;
					table = getTable(fld.table, fld.database);
					for ( colName in table.cols ) 
					{
						prepareField({
							field    : colName,
							alias    : null,
							table    : { table : table.name, database : table._db.name },
							database : table._db.name,
							isExpr   : false
						}, y++);
					}
				}
				else
				{
					for ( j = 0; j < tablesLength; j++ ) 
					{
						table = tables[j];
						for ( colName in table.cols ) 
						{
							prepareField({
								field    : colName,
								alias    : null,
								table    : { table : table.name, database : table._db.name },
								database : table._db.name,
								isExpr   : false
							}, y++);
						}
					}
				}
			} 
			else 
			{
				// If the field is not an expression and the number of used 
				// tables is not 1, require a table name to be specified
				if (!fld.isExpr && !fld.table) 
				{
					if ( tablesLength !== 1 )
					{
						throw new SQLParseError(
							'The column "%s" needs to have it\'s table specified',
							fld.field
						);
					}

					fld.table = query.tables[0];
				}

				prepareField(fld, y++);
			}
		}

		rowProto.__length__ = y;

		//console.warn(ENV, rowProto);

		// Collect all rows from all the tables --------------------------------
		var _data = [], arr;
		for ( i = 0; i < tablesLength; i++ )
		{
			arr = [];
			table = tables[i];
			for ( rowId in table.rows )
			{
				arr.push(table.rows[rowId].toJSON());
			}
			_data.push(arr);
		}

		// Add expression fields -----------------------------------------------
		for ( i = 0; i < fieldsLength; i++ )
		{
			fld = query.fields[i];
			if (fld.isExpr) {
				col = {};
				col[fld.alias || fld.field] = fld.field.replace(/^\s*\((.*?)(\)\s*$)/, "$1");
				_data.push([col]);
			}
		}

		//console.dir(_data);
		rows = crossJoin2(_data);
		

		// orderBy -------------------------------------------------------------
		if ( query.orderBy ) {
			rows.sort(function(a, b) {
				var out = 0, col, valA, valB, i, term; 
				for ( i = 0; i < query.orderBy.length; i++ ) {
					term = query.orderBy[i];
					col  = term.expression;
					//debugger;
					//if (!isNumeric(col)) {
					//	col = cols.indexOf(col);
					//}
					
					//col = intVal(col);

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

		// Evaluate expressions in field list ----------------------------------
		for ( i = 0; i < l; i++ ) {
			row = rows[i];
			for ( fieldName in row ) {
				f = rowProto[fieldName];
				if (f && f.isExpr) {
					row[fieldName] = executeCondition(row[fieldName], row);
				}
			}
		}

		var rows2 = [];
		
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

			row = rows[i];

			// Apply the "WHERE" conditions
			// -----------------------------------------------------------------
			if (query.where && !executeCondition(query.where, row)) {
				continue;
			}

			// Exclude unused fields from the result rows
			// -----------------------------------------------------------------
			for ( fieldName in row ) {
				f = rowProto[fieldName];
				if (!f) {
					delete row[fieldName];
				} 
				else if (f.alias && f.alias !== fieldName) {
					delete row[fieldName];
				}
			}

			rows2.push(row);
		}

		return {
			cols : cols,
			rows : rows2
		};
	}

	return new Task({
		name : "SELECT query",
		execute : function(done, fail) {//console.log("WALK SELECT");
			
			var query = {
				fields : [],
				tables : []
			};
			//debugger;
			collectFieldRefs(query.fields);

			
			//console.log("current: ", walker.current()[0]);
			walker.optional({
				"FROM" : function() {//console.log("current: ", walker.current()[0]);
					collectTableRefs(query.tables);
				}
			});

			query.where   = walkWhere(); 
			query.orderBy = walkOrderBy();
			query.bounds  = walkLimitAndOffset();
			//console.log("query: ", query);
			
			// table -------------------------------------------------------
			//var //tbl   = tableRef(),
			//	table = getTable(query.tables[0].table, query.tables[0].database);
			
			walker
			.errorUntil(";")
			.commit(function() {//console.log("EXEC SELECT");
				var result = execute(query);
				done({
					cols : result.cols,
					rows : result.rows
				});
			});
		},
		undo : function(done, fail) {
			done(); // There is nothing to undo after select
		}
	});
};