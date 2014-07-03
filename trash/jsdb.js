(function(GLOBAL, $, undefined) {

	var DATABASES = {};
	var CURRENT_DATABASE;
	var PARSERS = {};

	var REGEXP = {
		USE     : /^\s*USE\s+/i,
		SELECT  : /^\s*SELECT\s+((ALL|DISTINCT)\s+)?/i,
		DELETE  : /^\s*DELETE\s+FROM\s+/i,
		UPDATE  : /^\s*UPDATE\s+/i,
		INSERT  : /^\s*INSERT\s+(INTO\s+)?/i,
		REPLACE : /^\s*REPLACE\s+(INTO\s+)?/i,

		LIMIT   : /\bLIMIT\s+(\d+)/i,
		OFFSET  : /\bOFFSET\s+(\d+)/i,
		FROM    : /(.*?)(\bFROM\b(.+?))((?:WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|OFFSET|$).*$)/i,
		WHERE   : /(.*?)(\bWHERE\b(.+?))((?:GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|OFFSET|$).*$)/i,
		ORDERBY : /(.*?)(\ORDER\s+BY\b(.+?))((?:LIMIT|OFFSET|$).*$)/i,

		blocks : "(FROM|WHERE|GROUP\\s+BY|HAVING|ORDER\\s+BY|LIMIT|OFFSET)",

		commaListSeparator : /\s*,\s*/,
		aliasSplit : /\s+as\s+|\s+(?=[^\s\d]+\s*$)/i
	};

	var SqlQuery = (function() {

		var PARSERS = {
			"USE"    : parse__USE,
			"SELECT" : parse__SELECT
		};

		/**
		 * Class SqlQuery
		 */
		function SqlQuery( sql, debug ) 
		{
			if ( !(this instanceof SqlQuery) ) {
				return new SqlQuery(sql, debug);
			}

			this.sql = sql;
			this.debug = !!debug;

			this.parse();
		}

		SqlQuery.prototype = {

			/**
			 * Parses the SQL of the query. This method only tries to find the type 
			 * of the query and then invokes other parsers for the rest of the sql.
			 * @throws {Error} if the query type cannot be recognised.
			 * @return {SqlQuery}
			 */
			parse : function() 
			{
				var commands = {
						"USE"     : REGEXP.USE,
						"SELECT"  : REGEXP.SELECT,
						"DELETE"  : REGEXP.DELETE,
						"UPDATE"  : REGEXP.UPDATE,
						"INSERT"  : REGEXP.INSERT,
						"REPLACE" : REGEXP.REPLACE
					},
					sql = this.sql,
					cmd, match;

				// Reset the query state vars before parsing
				this.type       = undefined;
				this.tables     = {};
				this.fields     = {};
				this.fieldsLen  = 0;
				this.tablesLen  = 0;
				this.offset     = 0;
				this.limit      = 0;
				this.isDistinct = false;

				// Find out the query type and then pass the SQL to other parsers
				for ( cmd in commands ) {
					match = commands[cmd].exec(sql);
					if ( match ) {
						this.type = cmd;
						sql = PARSERS[cmd](
							sql.substr(match[0].length),
							this,
							match
						);
						sql = $.trim(sql);
						if (sql) {
							throw "The following parts of the SQL were" +
								  " not recognised: '" + sql + "'";			
						}
						return this;
					}
				}
				
				throw new Error("Unrecognised statement");
			},

			_addField : function(f)
			{
				if (!f.isExpression) {
					if (f.alias && this.fields[f.alias]) {
						throw new Error('Field "' + f.alias + '" is ambiguous');
					}
					if (!f.alias && this.fields[f.name]) {
						throw new Error('Field "' + f.name + '" is ambiguous');
					}
				}

				f.index = this.fieldsLen;
				
				this.fields[f.index] = f;
				
				if (!f.isExpression) {
					this.fields[f.table + "." + f.name ] = f;
					this.fields[f.db + "." + f.table + "." + f.name ] = f;
				}

				if (f.alias) {
					this.fields[f.alias] = f;	
				} else {
					this.fields[f.name ] = f;
				}

				this.fieldsLen++;
			},

			execute : function()
			{
				// A special case where no tables are used and all the fields should 
				// be expressions
				if (!this.tablesLen) {
					return this._executeAsExpression();
				}

				if ( !!this.debug ) {
					console.time("Query execution time");
				}

				var tables, table, ti,
					fields, field, fi,
					rows  , row  , ri,
					q   = this,
					out = [], 
					ctx = {},
					tmp;

				// Start by collecting all rows from all the tables
				// -------------------------------------------------------------
				tables = [];
				for (ti = 0; ti < q.tablesLen; ti++) {
					tmp = q.tables[ti];
					if (!tmp.db) {
						throw new Error(
							"No database specified for table '" + tmp.name + "'"
						);
					}
					if (!DATABASES[tmp.db]) {
						throw new Error("Unknown database '" + tmp.db + "'");
					}
					tmp = DATABASES[tmp.db].tables[tmp.name];

					rows = [];
					for (ri = 0; ri < tmp._length; ri++) {
						rows.push($.extend({}, tmp.rows[ri + 1]));
					}
					tables.push(rows);
				}

				// JOIN stage: merge table fields into rows
				// -------------------------------------------------------------
				rows = joinArrays(tables);//console.dir(rows);

				// Sort the result set
				// -------------------------------------------------------------
				if (this._order) {
					rows.sort(this._order);
				}

				for (ri = 0; ri < rows.length; ri++) {
					row = rows[ri];

					// Apply LIMIT
					// ---------------------------------------------------------
					if (q.limit) {
						if (ri >= q.offset + q.limit) {
							rows.splice(ri--, 1);
							continue;
						}
					}

					// Apply OFFSET
					// ---------------------------------------------------------
					if (q.offset) {
						if (ri < q.offset) {
							rows.splice(ri--, 1);
							continue;
						}
					}
					
					// Add aliases
					// ---------------------------------------------------------
					for ( fi = 0; fi < q.fieldsLen; fi++ ) {
						field = q.fields[fi];
						if (field.alias) {
							row[field.alias] = row[field.name];
						}
					}

					// Add expression fields
					// ---------------------------------------------------------
					for ( fi = 0; fi < q.fieldsLen; fi++ ) {
						field = q.fields[fi];
						if (field.isExpression) {
							if (field.alias) {
								row[field.alias] = executeCondition(field.name, row);
								ctx[field.alias] = row[field.alias];
							} else {
								row[field.name] = executeCondition(field.name, row);
							}
						}
					}

					// Apply the "WHERE" conditions
					// ---------------------------------------------------------
					//console.log(row);
					if (q.where && !executeCondition(q.where, row)) {
						rows.splice(ri--, 1);
						continue;
					}

					// Exclude unused fields from the result rows
					// ---------------------------------------------------------
					$.each(row, function(fieldName, fieldValue) {
						var f = q.fields[fieldName];
						if (!f) {
							delete row[fieldName];
						} 
						else if (f.alias && f.alias !== fieldName) {
							delete row[fieldName];
						}
					});
				}

				

				if ( !!this.debug ) {
					console.timeEnd("Query execution time");
					//console.dir(rows);
					console.table(rows);
					//console.dir(this);
					
				}

				return rows;
			},

			_executeAsExpression : function()
			{
				var field, fi, row,
					out = [], 
					ctx = {};

				// A special case where no tables are used and all the fields should 
				// be expressions
				row = {};
				for ( fi = 0; fi < this.fieldsLen; fi++ ) {
					field = this.fields[fi];
					try {
						if (field.alias) {
							row[field.alias] = executeCondition(field.name, ctx);
							ctx[field.alias] = row[field.alias];
						} else {
							row[field.name] = executeCondition(field.name, ctx);
						}
					} catch (ex) {
						console.dir(this);
						throw 'Failed to evaluate expression "' + field.name + '"';
					}
				}
				out[0] = row;
				return out;
			}
		};

		/*
		+----------------------------------------------------------------------+
		|                              PARSERS                                 |
		|                                                                      |
		| All of these functions accepr 3 arguments:                           |
		| 1. The string to parse                                               |
		| 2. The query instance                                                |
		| 3. The match of the sql command                                      |
		| They all must return the input string with the matched fragment(s)   |
		| removed                                                              |
		+----------------------------------------------------------------------+
		*/

		/**
		 * Parses an "USE database" SQL. This is the simplest possible parser as
		 * it only trims the input and uses it as the database name.
		 * @param {String} sql The query sql without the "USE" part
		 * @throws {Error} if the database does not exist.
		 * @return void
		 */
		function parse__USE(sql) 
		{
			var db = $.trim(sql);
			if (!DATABASES.hasOwnProperty(db)) {
				throw new Error('No such database "' + db + '"');
			}
			CURRENT_DATABASE = DATABASES[db];
		}

		/**
		 * Parses a "SELECT" SQL. 
		 * @param {String} sql The query sql without the "SELECT" part
		 * @throws {Error}
		 * @return {String} The input sql with all the recognised parts removed.
		 * 	                Should return an empty string. Otherwise the return 
		 *                  value shows what was not matched by any of the 
		 *                  parsers.
		 */
		function parse__SELECT(sql, query, match) 
		{
			if (match[2] && match[2].toUpperCase() == "DISTINCT") {
				query.isDistinct = true;
			}

			sql = parse__LIMIT   (sql, query);         // console.log(sql);
			sql = parse__OFFSET  (sql, query);         // console.log(sql);
			sql = parse__ORDER_BY(sql, query);         // console.log(sql);
			// HAVING
			// GROUP BY
			sql = parse__WHERE   (sql, query);         // console.log(sql);
			sql = parse__FROM    (sql, query);         // console.log(sql);
			sql = parse__list    (sql, query, parse__select_expr); // console.log(sql);
			return sql;
		}

		/**
		 * Extracts the "LIMIT" part from the SQL. 
		 * @param {String} sql The query sql
		 * @return {String} The input sql with all the recognised parts removed.
		 */
		function parse__LIMIT(sql, query) 
		{
			return sql.replace(REGEXP.LIMIT, function(input, num) {
				query.limit = parseInt(num);
				return "";
			});
		}

		/**
		 * Extracts the "OFFSET" part from the SQL. 
		 * @param {String} sql The query sql
		 * @return {String} The input sql with all the recognised parts removed.
		 */
		function parse__OFFSET(sql, query) {
			return sql.replace(REGEXP.OFFSET, function(input, num) {
				query.offset = parseInt(num);
				return "";
			});
		}

		function parse__ORDER_BY(sql, query) 
		{
			return sql.replace(
				REGEXP.ORDERBY, 
				function(input, prefix, orderby, items, suffix) {
					var tokens = items.split(/\s*,\s*/);
					query._order = function(a, b) {
						var out = 0;
						$.each(tokens, function(i, token) {
							var tok  = $.trim(token).split(/\s+/),
								col  = tok[0],
								type = tok.length > 1 && tok[1].toUpperCase() == "DESC" ?
									"DESC" :
									"ASC";

							if (executeCondition(col, a) > executeCondition(col, b)) {
								out += type == "ASC" ? 1 : -1;
							}
							else if (executeCondition(col, a) < executeCondition(col, b)) {
								out += type == "ASC" ? -1 : 1;
							}

							if (out !== 0)
								return false;
						});
						return out;
					};
					return prefix + " " + suffix;
				}
			);
		}

		/**
		 * Extracts the "FROM" part of the SQL. Multiple table referrences can 
		 * be specified as comma separated list. Each of them will be parsed 
		 * using parse__table_expr
		 * @param {String} sql The query sql
		 * @return {String} The input sql with all the recognised parts removed.
		 */
		function parse__FROM(sql, query) 
		{
			return sql.replace(
				REGEXP.FROM,
				function(input, prefix, from, tableRefs, suffix) {
					parse__list(tableRefs, query, parse__table_expr);
					return prefix + " " + suffix;
				}
			);
		}

		function parse__WHERE(sql, query) 
		{
			return sql.replace(
				REGEXP.WHERE,
				function(input, prefix, where, condition, suffix) {
					//console.log(arguments);
					query.where = $.trim(condition);
					return prefix + " " + suffix;
				}
			);
		}

		function parse__list(sql, query, parser)
		{
			$.each(
				$.trim(sql).split(REGEXP.commaListSeparator), 
				function(i, expr) {
					parser(expr, query);
				}
			);
		}

		function parse__select_expr(sql, query) {
			//console.log("select_expr: |" + sql + "|");
			//console.dir(this.tables);

			var tokens, alias, name, table, db, index, f, fieldName, _table;
			
			// Alias -----------------------------------------------------------
			tokens = sql.split(REGEXP.aliasSplit);
			alias  = tokens[1] || null;
			tokens = tokens[0];

			// Expression ------------------------------------------------------
			if ((/^\s*\(.*?\)\s*/).test(tokens)) {
				query._addField({
					alias : alias,
					name  : tokens,
					table : null,
					db    : null,
					isExpression : true
				});
				return;
			}

			// Name (or expression) --------------------------------------------
			tokens = tokens.split(".");
			name = $.trim(tokens.pop());

			// Table -----------------------------------------------------------
			if (tokens.length) {
				table = $.trim(tokens.pop());
			} else {
				if (query.tablesLen === 1) {
					table = query.tables[0].name;
				}
			}

			if (!table) {
				throw "Unknown table for field '" + name + "'";
			}

			if (!query.tables[table]) {
				throw "Unknown table '" + table + "'";
			}

			// Database --------------------------------------------------------
			if (tokens.length) {
				db = $.trim(tokens.pop());
			} else {
				if (table) {
					db = query.tables[table].db;
				} else {
					if (CURRENT_DATABASE) {
						db = CURRENT_DATABASE.name;
					}
				}
			}

			if (!db) {
				throw "Unknown database for field '" + table + "."+ name + "'";
			}

			if (!DATABASES[db]) {
				throw "Unknown database '" + db + "' for field '" + table + "."+ name + "'";
			}

			// Expand if the name is "*" ---------------------------------------
			if (name == "*") {

				if (alias) {
					throw new Error("Cannot give alias to '*'");
				}

				_table = DATABASES[db].tables[query.tables[table].name];
				for( fieldName in _table._fields ) {
					query._addField({
						alias : null,
						name  : fieldName,
						table : table,
						db    : db,
						isExpression : false
					});
				}
			} else {
				if (!(name in DATABASES[db].tables[query.tables[table].name]._fields)) {
					throw new Error('The table "' + db + '.' + table + '" has' + 
					' no field named "' + name + '"');
				}

				query._addField({
					alias : alias,
					name  : name,
					table : table,
					db    : db,
					isExpression : false
				});
			}
		}

		function parse__table_expr(sql, query)
		{
			if (!sql) return;

			var tokens = sql.split(REGEXP.aliasSplit),
				table = {
					alias : tokens[1] || null,
					name  : undefined,
					db    : undefined,
					index : query.tablesLen++
				};
				
			tokens = tokens[0].split(".");
			
			if (tokens.length > 2) {
				throw new Error('Invalid table "' + tokens.join(".") + '"');
			}

			table.name = $.trim(tokens.pop());

			if (tokens.length) {
				table.db = $.trim(tokens.pop());
			} else {
				table.db = CURRENT_DATABASE ? CURRENT_DATABASE.name : undefined;
			}

			query.tables[table.index] = table;
			query.tables[table.name] = table;

			if (table.alias) {
				query.tables[table.alias] = table;
			}
		}

		return SqlQuery;

	})();

	/**
	 * Cuts a slice of the results according to the current limit clause.
	 * @param {Array} arr The source array 
	 * @param {Number} start Where to start 
	 * @param {Number} length How many items to slice
	 * @returns {Array} The result array (shallow copy)
	 * @private
	 */
	function limit(arr, start, length) 
	{
		var len = arr.length, 
			out = arr;
		
		if (length === undefined) {
			length = start;
			start = 0;
		}
		
		if (start >= 0 && start < len - 1) {
			length = Math.min(length, len - start);
			out = out.splice(start, length);
		}
		return out;
	}

	/**
	 * Groups the input array by the given property name. The input array 
	 * should be an array of objects having the @field as their property.
	 * @param {Array} arrIn The input array.
	 * @param {String} field The name of the property to group by
	 * @returns {Array} The groupped result
	 */
	function groupBy(arrIn, field) 
	{
		var groups = {};
		$.each(arrIn, function(i, rec) {
			var x = rec[field];
			if (!groups.hasOwnProperty(x)) {
				groups[x] = [];
			}
			groups[x].push(rec);
		});
		return groups;
		/*
		var groups = {}, x, 
			out = $.grep(arrIn, function(item) {
				x = item[field];
				if (!groups.hasOwnProperty(x)) {
					groups[x] = 1;
					return true;
				}
				return false;
			});
		groups = null;
		return out;*/
	}

	/**
	 * Joins two or more arrays together by merging their value objects
	 * @param {Array} arrs An array of arrays of objects to me merged
	 * @return {array} The joined array
	 */
	function joinArrays(arrs, join, sort) 
	{
		var rows = [], rowIndex, row;
		
		if (!arrs) {
			return rows;
		}

		switch (join ? join.type : "") {
			case "INNER JOIN": // 280ms / 1000
				$.each(arrs, function(tableIndex, tableRows) {
					var hasMatch,
						tableRowsLength,
						rowsLength,
						rowIndex2,
						tmpRow,
						match,
						row2;

					if (tableIndex === 0) {
						rows = tableRows.slice();
					} else {
						rowsLength = rows.length;
						for (rowIndex = 0; rowIndex < rowsLength; rowIndex++) {
							hasMatch = false;
							row      = rows[rowIndex];
							trLength = tableRows.length;
							
							for (rowIndex2 = 0; rowIndex2 < trLength; rowIndex2++) {
								row2   = tableRows[rowIndex2];
								tmpRow = $.extend({}, row, row2);
								match  = tmpRow[join.key1] === tmpRow[join.key2];

								if (match) {
									if (!hasMatch) {
										hasMatch = 1;
										rows.splice(rowIndex, 1, tmpRow);
									} else {
										if (rowIndex2 === 0) {
											rows.splice(rowIndex, 1, tmpRow);
										} else {
											rows.splice(++rowIndex, 0, tmpRow);
											rowsLength++;
										}
									}
								}
							}

							if (!hasMatch) {
								rows.splice(rowIndex--, 1);
								rowsLength--;
							}
						}
					}
				});
			break;

			case "LEFT JOIN": // 300ms / 1000
				var tablesLen = arrs.length,
					rowsLen,
					tableRowsLen,
					tableIndex,
					tableRows,
					hasMatch,
					rowIndex2,
					row2,
					tmpRow,
					match,
					key;

				for (tableIndex = 0; tableIndex < tablesLen; tableIndex++) {
					tableRows = arrs[tableIndex];
					if (tableIndex === 0) {
						rows = tableRows.slice();
					} else {
						rowsLen = rows.length;
						for (rowIndex = 0; rowIndex < rowsLen; rowIndex++) {
							hasMatch     = false;
							row          = rows[rowIndex];
							tableRowsLen = tableRows.length;
							for (rowIndex2 = 0; rowIndex2 < tableRows.length; rowIndex2++) {
								row2   = tableRows[rowIndex2];
								tmpRow = $.extend({}, row, row2);
								match  = tmpRow[join.key1] === tmpRow[join.key2];

								if (match) {
									if (!hasMatch) {
										hasMatch = 1;
										rows.splice(rowIndex, 1, tmpRow);
									} else {
										if (rowIndex2 === 0) {
											rows.splice(rowIndex, 1, tmpRow);
										} else {
											rows.splice(++rowIndex, 0, tmpRow);
											rowsLen++;
										}
									}
								} else {
									if (rowIndex2 === 0) {
										for (key in row2) {
											row[key] = null;
										}
									}
								}
							}
						}
					}
				}
			break;
			
			case "RIGHT JOIN": // 300ms / 1000
				var tablesLen = arrs.length,
					tableIndex,
					tableRows,
					tableRowsLen,
					rowIndex2,
					row2,
					rowsLen,
					hasMatch,
					tmpRow,
					match,
					key;

				for (tableIndex = tablesLen - 1; tableIndex >= 0; tableIndex--) {
					tableRows = arrs[tableIndex];
					if (tableIndex === tablesLen - 1) {
						rows = tableRows.slice();
					} else {
						rowsLen = rows.length;
						for (rowIndex = 0; rowIndex < rowsLen; rowIndex++) {
							hasMatch     = false;
							row          = rows[rowIndex];
							tableRowsLen = tableRows.length;
							for (rowIndex2 = 0; rowIndex2 < tableRowsLen; rowIndex2++) {
								row2   = tableRows[rowIndex2];
								tmpRow = $.extend({}, row, row2);
								match  = tmpRow[join.key1] === tmpRow[join.key2];

								if (match) {
									if (!hasMatch) {
										hasMatch = 1;
										rows.splice(rowIndex, 1, tmpRow);
									} else {
										if (rowIndex2 === 0) {
											rows.splice(rowIndex, 1, tmpRow);
										} else {
											rows.splice(++rowIndex, 0, tmpRow);
											rowsLen++;
										}
									}
								} else {
									if (rowIndex2 === 0) {
										for (key in row2) {
											row[key] = null;
										}
									}
								}
							}
						}
					}
				}
			break;

			case "OUTER JOIN": // 200ms / 1000
			case "FULL JOIN":
			case "FULL OUTER JOIN":
				var proto      = {},
					leftTable  = arrs[0],
					rightTable = arrs[1];

				$.each(arrs, function(tableIndex, tableRows) {
					$.each(tableRows[0] || {}, function(k) {
						proto[k] = null;
					});
				});
				
				$.each(leftTable, function(rowIndex, row) {
					rows.push($.extend({}, proto, row));
				});

				$.each(rightTable, function(rowIndexR, rowR) {
					var found;
					$.each(rows, function(rowIndexL, rowL) {
						if (rowL[join.key1] === rowR[join.key2]) {
							if (rowR[join.key1] === null || rowL[join.key2] !== null) {
								rows.push($.extend({}, rowL, rowR));		
							} else {
								$.extend(rowL, rowR);
							}
							found = 1;
							return false;
						}
					});
					if (!found) {
						rows.splice(rowIndexR, 0, $.extend({}, proto, rowR));
					}
				});

				if (!sort) {
					rows.sort(function(a, b) {
						return (a[join.key1] || Infinity) - (b[join.key1] || Infinity);
					});
				}
			break;

			case "CROSS JOIN":// 300ms / 1000
			default:
				var rowIndex2,
					tableLen,
					rowsLen,
					row2;

				$.each(arrs, function(tableIndex, tableRows) {
					if (tableIndex === 0) {
						rows = tableRows.slice();
					} else {
						rowsLen = rows.length;
						for (rowIndex = 0; rowIndex < rowsLen; rowIndex++) {
							row      = rows[rowIndex];
							tableLen = tableRows.length;
							for (rowIndex2 = 0; rowIndex2 < tableLen; rowIndex2++) {
								row2 = tableRows[rowIndex2];
								if (rowIndex2 === 0) {
									$.extend(row, row2);
								} else {
									rows.splice(
										++rowIndex, 
										0, 
										$.extend({}, row, row2)
									);
									rowsLen++;
								}
							}
						}
					}
				});
			break;
		}

		return rows;
	}

	/**
	 * Navigates to the @path inside @obj and returns the value or updates it if
	 * called with 3 arguments.
	 * @param {Object} obj The object to use
	 * @param {String} path
	 * @param {*} value (optional)
	 */
	function jPath(obj, path, value) 
	{
	    var segments = path.split("."),
	        l        = segments.length,
	        curPath  = [],
	        modeGET  = 2,
	        modeSET  = 3,
	        modeDEL  = 4,
	        mode     = arguments.length === 3 ?
	            value === undefined ?
	                modeDEL :
	                modeSET :
	            modeGET,
	        cur = obj,
	        inArray,
	        name,
	        next,
	        i;

	    for ( i = 0; i < l; i++ ) {
	        curPath[i] = name = segments[i];
	        inArray = Object.prototype.toString.call(cur) == "[object Array]";

	        if (inArray) {
	            name = parseInt(name, 10);
	        }

	        if ( i === l - 1 ) { // last
	            if ( mode === modeDEL ) {
	                if ( inArray ) {
	                    cur.splice(name, 1);
	                }
	                else if ( cur.hasOwnProperty(name) ) {
	                    delete cur[name];
	                }
	            }
	            else if ( mode === modeSET ) {
	                cur[name] = value;
	            }
	            return cur[name];
	        }

	        if (!cur.hasOwnProperty(name)) {

	            // Called to read, but an intermediate path segment was not
	            // found - return undefined
	            if ( mode === modeGET ) {
	                return undefined;
	            }

	            // Called to write, but an intermediate path segment was not
	            // found - create it and continue
	            next = segments[ i + 1 ];
	            cur[name] = isNaN( parseFloat(next) ) ||
	                String(parseFloat(next)) !== String(next) ? {} : [];
	        }

	        cur = cur[name];
	    }
	}

	function callFunction(path) 
	{
		var args = Array.prototype.slice.call(arguments, 1),
			fn   = jPath(window, path),
			scope = null;
		if ($.isFunction(fn)) {
			if (path.indexOf(".") > 0) {
				scope = jPath(window, path.replace(/\.[^.]+$/, ""));
			}
			return fn.apply(scope, args);
		}
	}

	function executeInSandbox(options) 
	{
		var params       = [],
			values       = [],
			sandbox      = options.sandbox || {},
			translations = options.translations || {},
			scope        = options.scope || {};
			body         = options.code || '',
			context      = options.context || options.context === null ? options.context : {};

		$.each(sandbox, function(key, value) {
			params.push(key);
			values.push(value);
		});

		$.each(scope, function(key) {
			//translations[key] = "__scope__['" + key + "']";
			body = body.replace(new RegExp("\\b" + key + "\\b", "gi"), "__scope__['" + key + "']");
		});

		params.push("__scope__");
		values.push(scope);

		//console.log(body);
		$.each(translations, function(key, value) {
			body = body.replace(new RegExp(key, "gi"), value);
			//console.log(body);
		});
		body = body.replace(/^(\s*return\s+)?/, "return ");

		console.log(body);
		return Function( params.join(", "), body ).apply(context, values);
	}

	function LIKE(input, val) {//console.log("--> ", arguments);
		return (new RegExp(
			"^" + String(val)
				.replace(/\\%/g, "__ESCAPED_PCT__")
				.replace(/%/g, ".+?")
				.replace(/__ESCAPED_PCT__/g, "%")
				.replace(/\\_/g, "__ESCAPED_USC__")
				.replace(/_/g, ".")
				.replace(/__ESCAPED_USC__/g, "_")
				.replace(/\[\!(.+?)\]/g, "[^$1]")
			+ "$"
		)).exec(input);
	}

	function executeCondition(condition, scope) 
	{
		return executeInSandbox({
			code    : condition, 
			sandbox : {
				MAX : Math.max,
				MIN : Math.min,
				CONCAT : function() {
					return Array.prototype.slice.call(arguments).join("");
				},
				LIKE : LIKE
			},
			translations : {
				"\\bOR\\b"  : "||",
				"\\bAND\\b" : "&&",
				"={1,}"   : "===",
				"!={1,}"     : "!==",
				"(__scope__\\[[^\\]]+\\])\\s*LIKE\\s*('[^']*')" : function(all, input, search) {
					//console.log("--> ", arguments);
					return 'LIKE(' + input + ', ' + search + ')';
				}
			},
			scope   : scope, 
			context : {}
		});
	}

	function parseSql(sql) 
	{
		
		var cmd, match, query = {
			type      : undefined,
			tables    : {},
			fields    : {},
			fieldsLen : 0,
			tablesLen : 0,
			offset    : 0,
			limit     : 0
		};

		function executeSelectQuery(q) 
		{
			var tables, table, ti,
				fields, field, fi,
				rows  , row  , ri,
				tmp,
				out = [], 
				ctx = {};

			//console.log("Query:"); console.dir(q);

			// A special case where no tables are used and all the fields should 
			// be expressions
			if (!q.tablesLen) {
				row = {};
				for ( fi = 0; fi < q.fieldsLen; fi++ ) {
					field = q.fields[fi];
					if (field.alias) {
						row[field.alias] = executeCondition(field.name, ctx);
						ctx[field.alias] = row[field.alias];
					} else {
						row[field.name] = executeCondition(field.name, ctx);
					}
				}
				out[0] = row;
				return out;
			}


			// Start by collecting all rows from all the tables
			// -----------------------------------------------------------------
			tables = [];
			for (ti = 0; ti < q.tablesLen; ti++) {
				tmp = q.tables[ti];
				if (!tmp.db) {
					throw new Error("No database specified (TODO: 'USE db')");
				}
				if (!DATABASES[tmp.db]) {
					throw new Error("Unknown database '" + tmp.db + "'");
				}
				tmp = DATABASES[tmp.db].tables[tmp.name];

				rows = [];
				for (ri = 0; ri < tmp._length; ri++) {
					rows.push($.extend({}, tmp.rows[ri + 1]));
				}
				tables.push(rows);
			}
			//console.dir(tables);

			// JOIN stage: merge table fields into rows
			// -----------------------------------------------------------------
			rows = joinArrays(tables);//console.dir(rows);

			
			$.each(rows, function(rowIndex, row) {

				// Apply LIMIT
				// -------------------------------------------------------------
				if (q.limit) {
					if (rowIndex >= q.offset + q.limit) {
						delete rows[rowIndex];
						return true;
					}
				}

				// Apply OFFSET
				// -------------------------------------------------------------
				if (q.offset) {
					if (rowIndex < q.offset) {
						delete rows[rowIndex];
						return true;
					}
				}
				
				// Add expression fields
				// -------------------------------------------------------------
				for ( fi = 0; fi < q.fieldsLen; fi++ ) {
					field = q.fields[fi];
					if (!field.table) {
						if (field.alias) {
							row[field.alias] = executeCondition(field.name, row);
							ctx[field.alias] = row[field.alias];
						} else {
							row[field.name] = executeCondition(field.name, row);
						}
					}
				}

				// Apply the "WHERE" conditions
				// -------------------------------------------------------------
				if (q.where && !executeCondition(q.where, row)) {
					delete rows[rowIndex];
					return true;
				}

				// Exclude unused fields from the result rows
				// -------------------------------------------------------------
				$.each(row, function(fieldName, fieldValue) {
					if (!q.fields[fieldName]) {
						delete row[fieldName];
					}
				});
			});

			
			return rows;
		}

		var parsers = {

			// STATEMENTS ------------------------------------------------------

			"SELECT" : function(str) { // console.log(str);
				str = parsers.LIMIT(str);// console.log(str);
				str = parsers.OFFSET(str);// console.log(str);
				str = parsers.WHERE(str);// console.log(str);
				str = parsers.FROM(str);// console.log(str);
				str = parsers.select_expr_list(str);// console.log(str);
			},

			"DELETE"  : function(sql) {},
			"UPDATE"  : function(sql) {},
			"INSERT"  : function(sql) {},
			"REPLACE" : function(sql) {},

			"USE" : function(sql) {
				var db = $.trim(sql);
				if (!DATABASES.hasOwnProperty(db)) {
					throw new Error('No such database "' + db + '"');
				}
				CURRENT_DATABASE = DATABASES[db];
			},

			// BLOCKS ----------------------------------------------------------
			"FROM" : function(str) {
				return str.replace(
					/(.*?)(\bFROM\b(.+?))((?:WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|OFFSET|$).*$)/i,
					function(input, prefix, from, tableRefs, suffix) {
						$.each($.trim(tableRefs).split(/\s*,\s*/), function(e, expr) {
							parsers.table_expr(expr);
						});
						return prefix + " " + suffix;
					}
				);
			},

			"select_expr_list" : function(str) {
				$.each($.trim(str).split(/\s*,\s*/), function(e, expr) {
					parsers.select_expr(expr);
				});
			},
			"select_expr" : function(str) {//console.log("select_expr: |" + str + "|");
				var tokens = str.split(/\s+as\s+|\s+(?=[^\s\d]+\s*$)/i),
					field  = {
						alias : tokens[1] || null,
						name  : undefined,
						table : undefined,
						db    : undefined,
						index : query.fieldsLen++
					};
					
				tokens = tokens[0].split(".");
				field.name = $.trim(tokens.pop());

				if (tokens.length) {
					field.table = $.trim(tokens.pop());
					query.fields[field.table + "." + field.name] = field;
				}

				if (tokens.length) {
					field.db = $.trim(tokens.pop());
					query.fields[field.db + "." + field.table + "." + field.name] = field;
				}

				query.fields[field.index] = field;
				query.fields[field.name] = field;

				if (field.alias) {
					query.fields[field.alias] = field;
				}
			},
			"table_expr" : function(str) {
				if (!str) return;

				var tokens = str.split(/\s+as\s+|\s+(?=[^\s]+\s*$)/i),
					table = {
						alias : tokens[1] || null,
						name  : undefined,
						db    : undefined,
						index : query.tablesLen++
					};
					
				tokens = tokens[0].split(".");
				
				if (tokens.length > 2) {
					throw new Error('Invalid table "' + tokens.join(".") + '"');
				}

				table.name = $.trim(tokens.pop());

				if (tokens.length) {
					table.db = $.trim(tokens.pop());
				} else {
					table.db = CURRENT_DATABASE ? CURRENT_DATABASE.name : undefined;
				}

				query.tables[table.index] = table;

				if (table.alias) {
					query.tables[table.alias] = table;
				}
			},

			"LIMIT" : function(str) {
				return str.replace(/\bLIMIT\s+(\d+)/i, function(input, num) {
					query.limit = parseInt(num);
					return "";
				});
			},

			"OFFSET" : function(str) {
				return str.replace(/\bOFFSET\s+(\d+)/i, function(input, num) {
					query.offset = parseInt(num);
					return "";
				});
			},

			"WHERE" : function(str) {
				return str.replace(
					/(.*?)(\bWHERE\b(.+?))((?:GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|OFFSET|$).*$)/i,
					function(input, prefix, where, condition, suffix) {
						//console.log(arguments);
						query.where = $.trim(condition);
						return prefix + " " + suffix;
					}
				);
			}
		}

		do {
			match = /^\s*SELECT\s+/i.exec(sql);
			if (match) {
				query.type = "SELECT";
				break;
			}

			match = /^\s*DELETE\s+FROM\s+/i.exec(sql);
			if (match) {
				query.type = "DELETE";
				break;
			}

			match = /^\s*UPDATE\s+/i.exec(sql);
			if (match) {
				query.type = "UPDATE";
				break;
			}

			match = /^\s*INSERT\s+(INTO\s+)?/i.exec(sql);
			if (match) {
				query.type = "INSERT";
				break;
			}

			match = /^\s*REPLACE\s+(INTO\s+)?/i.exec(sql);
			if (match) {
				query.type = "REPLACE";
				break;
			}

			match = /^\s*USE\s+/i.exec(sql);
			if (match) {
				query.type = "USE";
				break;
			}

			throw new Error("Unrecognised statement");

		} while (0);

		parsers[query.type](sql.substr(match[0].length));

		return executeSelectQuery(query);
		//console.dir(query);

		/*
		SELECT
		    select_expr [, select_expr ...]
		    [FROM table_references]
		    [WHERE where_condition]
		    [GROUP BY {col_name | expr | position}
		      [ASC | DESC]
		    ]
		    [HAVING where_condition]
		    [ORDER BY {col_name | expr | position}
		      [ASC | DESC], ...]
		    [LIMIT {[offset,] row_count | row_count OFFSET offset}]*/
		    
	}
	
	/**
	 * Class DatabaseConnection
	 */
	function DatabaseConnection(dataPath) 
	{
		/**
		 * A reference to the selected database (if any)
		 * @var Database|null
		 */
		var _selectedDB = null;

		/**
		 * Loads a schema from JSON file
		 * @param {String} file The path to the JSON file
		 * @return {$.Deferred}
		 */
		this.loadSchema = function(file) 
		{
			var dfd = new $.Deferred(), inst = this;
			$.ajax({ url: file, dataType : "text" }).done(function(schema) {
				try {
					schema = Function("", "return (" + schema + ");")();
				} catch (ex) {
					console.error(
						'Failed to load schema from "' + file + '" - ' + 
						ex.message
					);
					dfd.rejectWith(inst, [ex]);
					return false;
				}
				inst.setSchema(schema);
				dfd.resolveWith(inst, [inst, schema]);
			}).fail(function(jqxhr, txt, ex) {
				console.error(
					'Failed to load schema from "' + file + '" - ' + 
					(ex ? ex.message : txt)
				);
				dfd.rejectWith(inst, arguments);
			});
			return dfd.promise();
		};

		/**
		 * Sets a schema from JSON object
		 * @param {Object} schema The JSON schema to set
		 * @return {DatabaseConnection} Returns the instance
		 */
		this.setSchema = function(schema) 
		{
			var inst = this;
			$.each(schema, function(db, tables) {
				db = inst.createDatabase(db, true);
				$.each(tables, function(name, data) {
					db.createTable(name, data.fields);
				});
			});
			return this;
		};

		/**
		 * Loads and sets data from JSON file
		 * @param {String} file The path to the JSON file
		 * @return {$.Deferred}
		 */
		this.loadDataInFile = function(file) 
		{
			var dfd = new $.Deferred(), inst = this;
			$.ajax({ url: file, dataType : "text" }).done(function(data) {
				try {
					data = Function("", "return (" + data + ");")();	
				} catch (ex) {
					console.error(
						'Failed to load data from "' + file + '" - ' + 
						ex.message
					);
					dfd.rejectWith(inst, [ex]);
					return false;
				}
				inst.setData(data);
				dfd.resolveWith(inst, [inst, data]);
			}).fail(function(jqxhr, txt, ex) {
				console.error(
					'Failed to load data from "' + file + '" - ' + 
					(ex ? ex.message : txt)
				);
				dfd.rejectWith(inst, arguments);
			});
			return dfd.promise();
		};

		/**
		 * Sets data on the DB server (might set data in multiple databases)
		 * @param {Object} data The data to set
		 * @return {DatabaseConnection} Returns the instance
		 */
		this.setData = function(data) 
		{
			var inst = this;
			$.each(data, function(db, tables) {
				db = inst.getDatabase(db);
				$.each(tables, function(name, data) {
					db.getTable(name).insert(data);
				});
			});
			return this;
		};

		/**
		 * Checks if the server has a database specified by name
		 * @param {String} name The name of the database
		 * @return {Boolean}
		 */
		this.hasDatabase = function(name) 
		{
			return DATABASES.hasOwnProperty(name);
		};

		/**
		 * Returns a refference to the database specified by name
		 * @param {String} name The name of the database to get
		 * @throws Error
		 */
		this.getDatabase = function(name) 
		{
			if (!this.hasDatabase(name))
				throw new Error('Database "' + name + '" does not exist');

			return DATABASES[name];
		};

		/**
		 * Selects the database to be used for further quieries.
		 * @param {String} name The name of the database
		 * @return {Database} The selected datbase
		 */
		this.selectDatabase = function(name) 
		{
			_selectedDB = this.getDatabase(name);
			return _selectedDB;
		};

		/**
		 * Creates and returns new Database
		 * @param {String} name The name of the database to create
		 * @param {Boolean} replace If to replace the current database if it 
		 * exists. Note that an exception will be thrown if such database exists
		 * and this is not set to true.
		 * @return {Database} The newly created database
		 */
		this.createDatabase = function(name, replace) 
		{
			if (this.hasDatabase(name)) {
				if (!replace)
					throw new Error('Database "' + name + '" already exists');

				this.deleteDatabase(name);
			}

			DATABASES[name] = new Database(name);
			return DATABASES[name];
		};

		this.deleteDatabase = function(name) 
		{
			delete DATABASES[name];
			return this;
		};
	}

	/**
	 * Class Database
	 */
	function Database(name, tables) 
	{
		this.tables = DATABASES[name] ? DATABASES[name].tables || {} : {};
		this.name = name;

		this.getTable = function(name) {
			if (!this.tables[name]) {
				if (!this.hasTable(name)) {
					throw 'Table "' + name + '" does not exist';
				}
				this.tables[name] = new Table(name);
			}
			return this.tables[name];
		};

		this.hasTable = function(name) 
		{
			return this.tables.hasOwnProperty(name);
		};		

		this.createTable = function(name, fields, replace) 
		{
			if (this.hasTable(name)) {
				if (!replace)
					throw new Error('Table "' + name + '" already exists');
				this.deleteTable(name);
			}

			var table = new Table(name, fields);
			this.tables[name] = table;
			return table;
		};

		this.deleteTable = function(name) 
		{
			return this;
		};

		this.insert = function(records, tableName)
		{
			if (!this.hasTable(tableName)) {
				throw 'Table "' + tableName + '" does not exist';
			}
			this.getTable(tableName).insert(records);
		};

		this.select = function(fieldList) 
		{
			var stmt = new SelectStatement(Array.prototype.slice.call(arguments));
			stmt.db = this;
			return stmt;
		};
	}

	function Table(name, fields) 
	{
		var _inst     = this;
			
		this._fields = fields || {};
		this._length = 0;
		this._index  = [];
		this._ai     = 1;

		this.name     = name;
		this.rows     = {};
		
		/**
		 * Validates and inserts a single record into the database table
		 */
		function insertRecord(rec) 
		{
			var key, value, field, record = {};
			for (key in rec) {
				field = _inst._fields[key];

				if (!field)
					throw new Error('Unknown field "' + key + '" for table "' + _inst.name + '"');

				value = rec[key];

				// TODO: validate

				record[key] = value;
			}

			var idx = _inst._ai++;

			_inst.rows[idx] = record;
			_inst._length = _inst._index.push(idx);
			return record;
		}

		this.insert = function(data) 
		{
			var inst = this;

			if ($.isArray(data)) {
				$.each(data, function(i, rec) {
					insertRecord(rec);
				});
			} else {
				insertRecord(data);
			}
		};
	}

	function Field() 
	{

	}

	// Statements --------------------------------------------------------------
	function Statement(db) 
	{
		//var db = this.db;
		var _table = null;

		/**
		 * Sets the table(s) that this statement should work with. 
		 * @param {String|Table|Array} t This can be the name of the table from 
		 * @db or Table instance or an array of those.
		 * @returns {Object} Returns the statement
		 */
		function setTable(t)
		{
			function getTableRef(arg)
			{
				var table = null, db;
				if ($.isArray(arg)) {
					if (arg.length === 1) {
						table = arg[0];
					}
					else if (arg.length == 2 &&
						typeof arg[0] == "string" &&
						typeof arg[1] == "string") 
					{
						db = DATABASES[arg[0]];
						if (!db) {
							throw new Error('Cannot find a database "' + arg[0] + '"');
						}
						table = db.getTable(arg[1]);
					}
				} else {
					table = arg;
					if (typeof table == "string") {
						table = db.getTable(table);
					}
				}

				if (!table || !(table instanceof Table)) {
					throw new Error("Invalid table");
				}
				return table;
			}

			// Multiple tables
			if ( $.isArray(t) ) {
				_table = [];
				$.each(t, function(i, _t) {
					_table.push(getTableRef(_t));
				});
			} else {
				_table = getTableRef(t);
			}
			return this;
		}

		Statement.insert = function(values)
		{
			return {
				into : setTable,
				execute : function() {
					_table.insert(values);
				}
			};
		};
	}

	function InsertStatement(records) 
	{
		this.into = function(tableName) 
		{

		};
	}

	/**
	 * Creates a statement object that can be used to query JavaScript arrays.
	 * This is not an SQL interpreter, but only tries to bring the best of both 
	 * worlds (SQL and JS) together.
	 * @param {Database} db 
	 * @returns SelectStatement
	 */
	function SelectStatement(fields) {
		
		var _table       = null;
		var _tables      = {};
		var _fields      = fields || [];
		var _filter      = null;
		var _limitStart  = 0;
		var _limitLength = 0;
		var _groupBy     = null;
		var _order       = null;
		var _where       = null;
		var _join        = null;

		function setFields(fields)
		{
			_fields = [];
			$.each(fields, function(i, f) {
				var tokens, field = {};
				if (f == "*") {
					field.table = "__CURRENT_TABLE__";
					field.name  = f;
					field.alias = f;
				} else {
					tokens = f.split(/\s+as\s+/i);
					if (tokens.length == 2) {
						field.alias = tokens[1];
					}
					f = tokens[0];

					tokens = f.split(".");
					if (tokens.length === 1) {
						field.table = "__CURRENT_TABLE__";
						field.name  = tokens[0];
					} else if (tokens.length == 2) {
						field.table = tokens[0];
						field.name  = tokens[1];
					}

					if (!field.alias) {
						field.alias = field.name;
					}
				}

				_fields.push(field);
			});
		}

		function setTableRef(arg, db)
		{
			var table = arg, tokens, alias;
			if (typeof table == "string") {
				
				// find the table alias (if any)
				tokens = table.split(/\s+as\s+/i);
				if (tokens.length == 2) {
					alias = tokens[1];
				} else {
					//alias = '__CURRENT_TABLE__';
				}
				table = tokens[0];

				tokens = table.split(".");
				if (tokens.length === 1) {
					if (typeof db == "undefined") {
						throw new Error('Unknown database');
					}
					table = db.getTable(tokens[0]);
				} else if (tokens.length == 2) {
					db = DATABASES[tokens[0]];
					if (!db) {
						throw new Error('Cannot find a database "' + tokens[0] + '"');
					}
					table = db.getTable(tokens[1]);
				} else {
					throw new Error('Invalid table "' + table + '"');
				}
			}

			if (!table || !(table instanceof Table)) {
				throw new Error("Invalid table");
			}

			
			if (alias) {
				_tables[alias] = table;	
				//table.alias = alias;
			} else {
				_tables[table.name] = table;
				//table.alias = table.name;
			}

			return table;
		}

		setFields($.makeArray(fields));//console.log(_fields);
		
		/**
		 * What to query from. This can be either the name of the table from @db
		 * or a Table instance.
		 * @param {String|Table} from
		 * @returns {SelectStatement} Returns this instance
		 */
		this.from = function(t)
		{
			var db = this.db, args = arguments;
			
			// Reset the tables first
			_tables = {};

			// Multiple tables
			if ( args.length > 1 ) {
				_table = [];
				$.each(args, function(i, _t) {
					_table.push(setTableRef(_t, db));
				});
			} 

			// Single table
			else {
				_table = setTableRef(t, db);
			}

			return this;
		};

		function setJoin(db, tableSpec, type, key1, key2) 
		{
			if (!$.isArray(_table)) {
				_table = [_table];
			}
			_table.push(setTableRef(tableSpec, db));
			_join = { type : type, key1 : key1, key2 : key2 || key1 };
		}

		this.innerJoin = function(tableSpec, key1, key2)
		{
			setJoin(this.db, tableSpec, "INNER JOIN", key1, key2);
			return this;
		};

		this.leftJoin = function(tableSpec, key1, key2)
		{
			setJoin(this.db, tableSpec, "LEFT JOIN", key1, key2);
			return this;
		};

		this.rightJoin = function(tableSpec, key1, key2)
		{
			setJoin(this.db, tableSpec, "RIGHT JOIN", key1, key2);
			return this;
		};

		this.outerJoin = function(tableSpec, key1, key2)
		{
			setJoin(this.db, tableSpec, "OUTER JOIN", key1, key2);
			return this;
		};
		
		/**
		 * You can use your own function here to filter the result.
		 * @param {Function} fn The filter function
		 * @returns {SelectStatement} Returns this instance to allow chained access.
		 */
		this.filter = function(fn) {
			_filter = fn;
			return this;
		};
		
		/**
		 * Sets the groupBy property name.
		 * @param {String} name The name of the property to group by. Note that it 
		 *                      MUST exist as property of the result records.
		 * @returns {SelectStatement} Returns this instance to allow chained access.
		 */
		this.groupBy = function(name) {
			_groupBy = name;
			return this;
		};
		
		/**
		 * Limits the results. 
		 * Examples:
		 * 
		 * limit(5)    -> The first 5 results
		 * limit(2, 5) -> The first 5 results, starting from 2 (2 to 7)
		 * 
		 * @param {Number} start Where to start from (or how many records to include
		 *                       if we use a single argument.
		 * @param {Number} length How many records to include.
		 * @returns {SelectStatement} Returns this instance to allow chained access.
		 */
		this.limit = function(start, length) {
			if (length === undefined) {
				length = start;
				start = 0;
			}
			
			if (start !== undefined) {
				_limitStart = start;
				_limitLength = length;
			}
			
			return this;
		};
		
		/**
		 * You can use your own function here to sort the result.
		 * @param {Function} fn The sorter function
		 * @returns {SelectStatement} Returns this instance to allow chained access.
		 */
		this.order = this.orderBy = function(fn) {
			if (typeof fn == "function") {
				_order = fn;
			} else {
				var tokens = String(fn || "").split(/\s*,\s*/);
				_order = function(a, b) {
					var out = 0;
					$.each(tokens, function(i, token) {
						var tok  = $.trim(token).split(/\s+/),
							col  = tok[0],
							type = tok.length > 1 && tok[1].toUpperCase() == "DESC" ?
								"DESC" :
								"ASC";

						if (a[col] > b[col]) {
							out += type == "ASC" ? 1 : -1;
						}
						else if (a[col] < b[col]) {
							out += type == "ASC" ? -1 : 1;
						}

						if (out !== 0)
							return false;
					});
					return out;
				};
			}
			return this;
		};
		
		/**
		 * Sets the where conditions
		 * @param {Object} where Should be a flat object that is a map of the 
		 *                 desired property values. For example: 
		 *                 
		 *                 where({ a: 1, b : true });
		 *                 
		 *                 will restrict the result to only the records having the 
		 *                 a property equal to 1 and b equal to true.
		 * @returns {SelectStatement} Returns this instance to allow chained access.
		 */
		this.where = function(where) {
			_where = where;
			return this;
		};
		
		/**
		 * Executes the query. 
		 * @param {Function} mapper If provided, this function will be called once 
		 *                          for each record and can be used to translate the 
		 *                          result to an array of something else... 
		 * @returns {Array}
		 */
		this.execute = function(mapper) {
			var usedTables   = $.makeArray(_table),
				tablesLen    = usedTables.length,
				fieldsLen    = _fields.length,
				tableResults = [],
				records      = [],
				tmp;

			function getCurrentTableAlias(table) {
				for (var alias in _tables) {
					if (_tables[alias] === table) return alias;
				}
				return table.name;
			}

			if (tablesLen) {
				
				// Step 1: Collect everything fromm all the used tables
				// -------------------------------------------------------------
				//console.dir(_tables);
				//console.dir(_table);
				//console.dir(usedTables);
				$.each(_tables, function(tableAlias, table) {
					var tableResult = [];
					$.each(table.rows, function(idx, row) {
						var rec = {};
						$.each(table._fields, function(fieldName) {
							var key  = fieldName;
							key      = tableAlias + "." + key;
							rec[key] = row[fieldName];

							$.each(_fields, function(fi, field) {//console.log(field, table.alias, fieldName);
								if (field.alias !== field.name && 
									field.table === tableAlias && 
									field.name  === fieldName) 
								{
									rec[field.alias] = row[fieldName];
								}
							});
						});
						tableResult[idx-1] = rec;
					});
					tableResults.push(tableResult);
				});//console.dir(tableResults);
				
				// Step 2: Perform the join of the table data
				// -------------------------------------------------------------
				records = joinArrays(tableResults, _join);//console.dir(records);

				// Step 3: Apply the "where" and "filter" over the full set
				// -------------------------------------------------------------
				if ( _where || _filter ) {
					for (var i = records.length - 1, row; i >= 0; i--) {
						row = records[i];

						if ( _where ) {
							if ( typeof _where == "function" ) {
								if ( _where(row) === false ) {
									records.splice(i, 1);
								}
							} else if ( typeof _where == "object" ) {
								$.each(_where, function(key, value) {
									if (key.indexOf(".") == -1) {
										key = getCurrentTableAlias(usedTables[0]) + "." + key;
									}
									if (!row.hasOwnProperty(key)) {
										throw new Error(
											"Unknown column '" + key + 
											"' in the WHERE filter"
										);
									}
									if (row[key] !== value) {
										delete records[i];
										return false; // break
									}
								});
							} else if ( typeof _where == "string" ) {
								if (!executeCondition(_where, row)) {
									records.splice(i, 1);
								}
							}
						}
					}
				}//console.dir(records);

				// Step 4: Normalize the result by re-indexing the keys and 
				// renaming the labels from {table}.{Field} to {Field}
				// -------------------------------------------------------------
				
				var tmp = [];
				$.each(records, function(i, row) {
					if (row) { // might be undefined because the index is missing
						var rec = {};
						$.each(_fields, function(idx, field) {//console.dir(field);
							if (field.name == "*") {
								$.each(row, function(label, data) {
									var key;
									if (field.table == "__CURRENT_TABLE__" || 
										label.indexOf(field.table + ".") === 0) 
									{
										key = label.substr(label.indexOf(".") + 1);
										if (rec.hasOwnProperty(key)) {
											throw new Error(
												'Field "' + key + '" is ambiguous.'
											);
										}
										rec[key] = data;
									}
								});
							} else {
								
								var key = field.alias;
								if (key === field.name || field.table == "__CURRENT_TABLE__") {
									key = field.table == "__CURRENT_TABLE__" ? 
										getCurrentTableAlias(usedTables[0]) + "." + field.name : 
										field.table + "." + key;
								}
								//console.log(key)
								//var key = field.table + "." + field.alias;
								//console.log(field, row, key, field.alias + " = " + row[key])
								if (rec.hasOwnProperty(field.alias)) {
									throw new Error(
										'Field "' + field.alias + '" is ambiguous.'
									);
								}
								rec[field.alias] = row[key];
							}
						});
						tmp.push(rec);
					}
				});
				records = tmp;

				// Step 5: Sort the result set
				// -------------------------------------------------------------
				if (_order) {
					records.sort(_order);
				}

				// Step 6: Apply the start/length limits
				// -------------------------------------------------------------
				if (_limitLength) {
					records = limit(records, _limitStart, _limitLength);
				}
				
				// Step 7: Group the results if needed
				// -------------------------------------------------------------
				if (_groupBy) {
					records = groupBy(records, _groupBy);
				}
			}

			if (mapper) {
				return $.map(records, mapper);
			}
			
			return records;
		};
	}

	////////////////////////////////////////////////////////////////////////////
	

	

	/**
	 * Class Cell
	 */
	function Cell(name, value, table) 
	{
		this.name = name;
		this.value = value;
	}

	
	
	function Row() {}
	function use(dbName) {}
	function select(fieldList) {}
	function update(data) {}
	function insert(data) {}
	function unset() {}

	GLOBAL.JSDB = {
		
		connect : function(dataPath)
		{
			return new DatabaseConnection(dataPath || "./");
		},

		select : function(fieldList) 
		{
			var stmt = new SelectStatement(Array.prototype.slice.call(arguments));
			//stmt.db = this;
			return stmt;
		},

		parseSql : parseSql,
		SqlQuery : SqlQuery,


		DATABASES : DATABASES
	};

})(window, jQuery);
