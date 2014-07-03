(function(GLOBAL, $, undefined) {

	var DATABASES = {};

	var CURRENT_DATABASE;
	
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
		
		// Data Definition Statements
		CREATE   : /\bCREATE\s+(?:TEMPORARY\s+)?(DATABASE|TABLE)\b/i,
		ALTER    : /\bALTER\s+(DATABASE|TABLE)\b/i,
		DROP     : /\bDROP\s+(DATABASE|SCHEMA|TABLE)\b/i,
		RENAME   : /\bRENAME\s+TABLE\b/i,
		TRUNCATE : /\bTRUNCATE\s+TABLE\b/i,

		blocks : "(FROM|WHERE|GROUP\\s+BY|HAVING|ORDER\\s+BY|LIMIT|OFFSET)",

		commaListSeparator : /\s*,\s*/,
		aliasSplit : /\s+as\s+|\s+(?=[^\s\d]+\s*$)/i
	};

	GLOBAL.JSDB = {};

	// Utils
	// =========================================================================
	function unQuote(x)
	{
		if (typeof x != "string")
			return x;
		var q = x[0];
		if (q != '"' && q != "'" && q != "`")
			return x;
		return x
			.replace(new RegExp("^" + q), "")
			.replace(new RegExp(q + "$"), "")
			.replace(new RegExp(q + "" + q, "g"), q);
	}

	JSDB.TOKEN_TYPE_WORD = 1;
	JSDB.TOKEN_TYPE_NUMBER = 2;
	JSDB.TOKEN_TYPE_OPERATOR = 3;
	JSDB.TOKEN_TYPE_SINGLE_QUOTE_STRING = 4;
	JSDB.TOKEN_TYPE_DOUBLE_QUOTE_STRING = 5;
	JSDB.TOKEN_TYPE_BACK_TICK_STRING = 6;
	JSDB.TOKEN_TYPE_SUBMIT = 7;
	JSDB.TOKEN_TYPE_COMMENT = 8;

	var OPERATORS = {
		// Logical Operators
		ALL     : 1,
		AND     : 1,
		ANY     : 1,
		BETWEEN : 1,
		EXISTS  : 1,
		IN      : 1,
		LIKE    : 1,
		NOT     : 1,
		OR      : 1,
		IS      : 1,
		NULL    : 1,
		UNIQUE  : 1,

		// Comparison Operators
		"="  : 1,
		"!=" : 1,
		"<>" : 1,
		">"  : 1,
		"<"  : 1,
		">=" : 1,
		"<=" : 1,
		"!<" : 1,
		"!>" : 1,

		// Arithmetic Operators
		"+" : 1,
		"-" : 1,
		"*" : 1,
		"/" : 1,
		"%" : 1
	};

	function tokenize(sql)
	{
		var len = sql.length,
			pos = 0,
			out = { tokens : [] },
			buf = "",
			expect = "",
			block = out,
			cur, next, prev, inString, inComment;

		function commitBuffer(typeHint)
		{
			if (!buf) 
				return;

			if (typeHint) {
				block.tokens.push({
					value : buf,
					type  : typeHint
				});	
			} else {
				block.tokens = block.tokens.concat(
					$.map(buf.split(/\s*(\!=|\!<|!>|<>|>=|<=|<|>|=|\+|-|\*|\/|%|,)\s*/), function(x) {
						if (x === "")
							return null;
						return { 
							value : x, 
							type: x.match(/[a-z]/i) ? 
								JSDB.TOKEN_TYPE_WORD :
								x.match(/^-?\d+(\.\d+)?$/i) ?
									JSDB.TOKEN_TYPE_NUMBER : 
									JSDB.TOKEN_TYPE_OPERATOR 
						};
					})
				);
			}
			buf = "";
		}

		while ( pos < len ) {
			cur = sql[pos];
			switch (cur) {
				
				// Escape sequences --------------------------------------------
				case "\\":
					pos++;
					next = sql[pos];
					switch (next) {
						case "0" : buf += "\0" ; break; // An ASCII NUL (0x00) character
						case "b" : buf += "\b" ; break; // A backspace character
						case "n" : buf += "\n" ; break; // A newline (linefeed) character
						case "r" : buf += "\r" ; break; // A carriage return character
						case "t" : buf += "\t" ; break; // A tab character
						case "Z" : buf += "\Z" ; break; // ASCII 26 (Control+Z)
						case "%" : buf += "\\%"; break;
						case "_" : buf += "\\_"; break;
						default  : buf += next ; break;
					}
				break;

				// Comments ----------------------------------------------------
				case "-":
					if (inString) {
						buf += cur;
					} else {
						if (!inComment) {
							if ( sql[pos + 1] == "-" ) {
								commitBuffer();
								buf = cur;
								inComment = 1;
							} else {
								buf += cur;
							}
						} else {
							buf += cur;
						}
					}
				break;

				// EOLs --------------------------------------------------------
				case "\n":
					if (inString) {
						buf += cur;
					} else {
						if ( inComment ) {
							commitBuffer(JSDB.TOKEN_TYPE_COMMENT);
							inComment = 0;
						}
					}
				break;

				// String in single quotes -------------------------------------
				case "'":
					if (expect == "'") {
						if (sql[pos + 1] == cur) {
							buf += cur;
							pos++;
						} else {
							block.tokens.push({ 
								value: buf,
								type: JSDB.TOKEN_TYPE_SINGLE_QUOTE_STRING
							});
							buf = "";
							expect = "";
							inString = 0;
						}
					} else if (inComment) {
						buf += cur;
					} else {
						commitBuffer();
						expect = "'";
						inString = 1;
					}
				break;

				// String in double quotes -------------------------------------
				case '"':
					if (expect == '"') {
						if (sql[pos + 1] == cur) {
							buf += cur;
							pos++;
						} else {
							block.tokens.push({ 
								value: buf,
								type: JSDB.TOKEN_TYPE_DOUBLE_QUOTE_STRING
							});
							buf = "";
							expect = "";
							inString = 0;
						}
					} else if (inComment) {
						buf += cur;
					} else {
						commitBuffer();
						expect = '"';
						inString = 1;
					}
				break;

				// String in back ticks ----------------------------------------
				case '`':
					if (expect == '`') {
						if (sql[pos + 1] == cur) {
							buf += cur;
							pos++;
						} else {
							block.tokens.push({
								value: buf,
								type: JSDB.TOKEN_TYPE_BACK_TICK_STRING
							});
							buf = "";
							expect = "";
							inString = 0;
						}
					} else if (inComment) {
						buf += cur;
					} else {
						commitBuffer();
						expect = '`';
						inString = 1;
					}
				break;

				// Block start -------------------------------------------------
				case "(":
					if (inString || inComment) {
						buf += cur;
					} else {
						commitBuffer();
						var newBlock = { tokens: [], parent: block };
						block = newBlock;
						expect = ")";
					}
				break;

				// Block end ---------------------------------------------------
				case ")":
					if (inString || inComment) {
						buf += cur;
					} else {
						commitBuffer();
						block.parent.tokens.push(block.tokens);
						block = block.parent;
						expect = "";
					}
				break;

				// Submit ------------------------------------------------------
				case ";":
					if (inString || inComment) {
						buf += cur;
					} else {
						commitBuffer();
						block.tokens.push({ 
							value: cur,
							type: JSDB.TOKEN_TYPE_SUBMIT
						});
					}

				// White space -------------------------------------------------
				case " ":
					if (inString || inComment) {
						buf += cur;
					} else {
						commitBuffer();
					}
				break;

				// Everything else ---------------------------------------------
				default:
					buf += cur;
				break;
			}
			pos++;
		}

		commitBuffer();

		return block.tokens;
	






		function handleSingleQuotedString(str) {}
		function handleDoubleQuotedString(str) {}
		function handleBacktickQuotedString(str) {}
	

		function getStringTokenStartingAt(sql, offset) 
		{
			var len = sql.length, quot, end, tok, tmp;

			if (!len || offset >= len - 1)
				return;

			quot = sql[offset];
			end  = sql.indexOf(quot, offset + 1);
			
			if (end == -1) 
				return;

			tok = sql.substring(offset + 1, end);
			while ( end > 0 && end < len - 1 ) {
				if ( sql[end - 1] == "\\" ) {
					tok = sql.substring(offset + 1, end - 1);
					tmp = end;
					end = sql.indexOf(quot, end+1);
					if (end > 0) {
						tok = tok + sql.substring(tmp, end);
					}
					continue;
				}
				if ( sql[end + 1] == quot ) {
					tmp = end;
					end = sql.indexOf(quot, end + 2);
					if (end > 0) {
						tok += sql.substring(tmp+1, end);
					}
					continue;
				}
				break;
			}

			return { 
				value: tok,
				start: offset + 1,
				end  : end
			};
		}

		function getStringTokens(sql, quot) 
		{
			var out   = [],
				len   = sql.length,
				start = -1,
				end   = -1,
				i     =  0,
				tok,
				tmp;

			do {
				start = sql.indexOf(quot, end + 1);
				if (start == -1) break;

				if (start > 0)
					out.push({ type: "sql", value: sql.substring(end + 1, start) });

				end = sql.indexOf(quot, start + 1);
				if (end == -1) break;

				tok = sql.substring(start + 1, end);
				while ( end > 0 && end < len - 1 ) {
					if ( sql[end - 1] == "\\" ) {
						tok = sql.substring(start + 1, end - 1);
						tmp = end;
						end = sql.indexOf(quot, end+1);
						if (end > 0) {
							tok = tok + sql.substring(tmp, end);
						}
						continue;
					}
					if ( sql[end + 1] == quot ) {
						tmp = end;
						end = sql.indexOf(quot, end + 2);
						if (end > 0) {
							tok += sql.substring(tmp+1, end);
						}
						continue;
					}
					break;
				}

				out.push({ type: "str", value: tok });

			} while ( true );

			if (end > 0)
				out.push({ type: "sql", value: sql.substr(end + 1) });

			return out;
		}

		var out = [], i = 0, str = sql;

		do {
			str = str.replace(/('|"|`).*/, function(all, quot, pos, input) {
				console.log(arguments);
				var token = getStringTokenStartingAt(input, pos);
				if (token) {
					out.push(token);
					return input.substr(token.end + 1);	
				}
				return input.substr(pos + 1);
			});
		} while (str && ++i < 100);

		return out;
	}
	

	// =========================================================================
	/**
	 * Creates and returns new Database
	 * @param {String} name The name of the database to create
	 * @param {Boolean} replace If to replace the current database if it 
	 * exists. Note that an exception will be thrown if such database exists
	 * and this is not set to true.
	 * @return void
	 */
	function createDatabase(name, ifNotExists) 
	{
		if (DATABASES.hasOwnProperty(name)) {
			if (!ifNotExists) {
				throw new Error('Database "' + name + '" already exists');
			}
			return;
		}

		DATABASES[name] = new Database(name);
	}

	function dropDatabase(name, ifExists) 
	{
		if (DATABASES.hasOwnProperty(name)) {
			delete DATABASES[name];
		} else {
			if (!ifExists) {
				throw new Error('Database "' + name + '" does not exist');
			}
		}
	}

	function createTable(name, fields, ifNotExists, database)
	{
		database = database || CURRENT_DATABASE;
		if (!database) {
			throw new Error("No database selected");
		}

		if (database.tables.hasOwnProperty(name)) {
			if (!ifNotExists) {
				throw new Error('Table "' + name + '" already exists');
			}
		}

		return database.tables[name] = new Table(name, fields);
	}

	function dropTable(name, ifExists, database) 
	{
		database = database || CURRENT_DATABASE;
		if (!database) {
			throw new Error("No database selected");
		}

		if (!database.tables.hasOwnProperty(name)) {
			if (!ifExists) {
				throw new Error('Table "' + name + '" does not exist');
			}
		}

		delete database.tables[name];
	}

	function executeSqlFile(path, debug)
	{
		var dfd = new $.Deferred();
		$.ajax({ url: path, dataType : "text" }).done(function(data) {
			//try {
				var arr = [];
				$.each(data.split(/\n/), function(i, line) {
					line = line.replace(/^(.*?)--.*/, "$1");
					if (line) {
						arr.push(line);
					}
				});
				arr = arr.join("");
					//console.time("Tokenize");
						//console.dir(
					//		tokenize(arr)
						//);
					//console.timeEnd("Tokenize");
				arr = arr.split(";");
				//console.log("Queries:\n--------------------------\n" + arr.join("\n"));
				$.each(arr, function(i, query) {
					query = $.trim(query);
					if (query) {
						(new SqlQuery(query, debug)).execute();
					}
				});
				console.dir(DATABASES)
				//data = Function("", "return (" + data + ");")();	
			//} catch (ex) {
			//	console.error(
			//		'Failed to load data from "' + path + '" - ' + 
			//		ex.message
			//	);
			//	dfd.reject(ex);
			//	return false;
			//}
			//inst.setData(data);
			dfd.resolve(data);
		}).fail(function(jqxhr, txt, ex) {
			console.error(
				'Failed to load data from "' + path + '" - ' + 
				(ex ? ex.message : txt)
			);
			dfd.rejectWith(inst, arguments);
		});
		return dfd.promise();
	}

	// =========================================================================

	var SqlQuery = (function() {

		var PARSERS = {
			"USE"    : parse__USE,
			"DROP"   : parse__DROP,
			"CREATE" : parse__CREATE,
			"SELECT" : parse__SELECT,
			"INSERT" : parse__INSERT
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
						"REPLACE" : REGEXP.REPLACE,
						"CREATE"  : REGEXP.CREATE,
						"DROP"    : REGEXP.DROP
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

		function parse__DROP(sql, query, match)
		{
			var what = match[1].toUpperCase();
			if (what == "DATABASE" || what == "SCHEMA") {
				parse__DROP_DATABASE(sql, query);
			} else if (what == "TABLE") {
				parse__DROP_TABLE(sql, query);
			} else {
				throw new Error('Unrecognised statement "' + query.sql + '"');
			}
		}

		function parse__DROP_DATABASE(sql, query)
		{
			var match = sql.match(/^\s*(IF\s+EXISTS\s+)?(.+?)\s*$/);

			if (!match) {
				throw new Error('Unrecognised statement "' + query.sql + '"');
			}
			
			dropDatabase(match[2], !!match[1]);
		}

		function parse__DROP_TABLE(sql, query)
		{
			var match = sql.match(/^\s*(IF\s+EXISTS\s+)?(.+?)\s*$/);

			if (!match) {
				throw new Error('Unrecognised statement "' + query.sql + '"');
			}
			
			dropTable(match[2], !!match[1]);
		}

		function parse__CREATE(sql, query, match)
		{
			var what = match[1].toUpperCase();
			if (what == "DATABASE") {
				parse__CREATE_DATABASE(sql, query);
			} else if (what == "TABLE") {
				parse__CREATE_TABLE(sql, query);
			} else {
				throw new Error('Unrecognised statement "' + query.sql + '"');
			}
		}

		function parse__CREATE_DATABASE(sql, query)
		{
			var match = sql.match(/^\s*(IF\s+NOT\s+EXISTS\s+)?(.+?)(\s+.*)?$/i);
			
			if (!match) {
				throw new Error('Unrecognised statement "' + query.sql + '"');
			}
			
			createDatabase(match[2], !!match[1]);
		}

		function parse__CREATE_TABLE(sql, query)
		{
			var match   = sql.match(/^\s*(IF\s+NOT\s+EXISTS\s+)?(.+?)\((.*?)\)[^)]*$/i);
			if (!match) {
				throw new Error('Unrecognised statement "' + query.sql + '"');
			}

			var ifNotExists = !!match[1];
			var name        = unQuote($.trim(match[2]));
			var fields      = $.trim(match[3]).split(/\s*,\s*/);
			//console.log("parse__CREATE_TABLE", ifNotExists, name, fields);

			var tableFields = {};
			var PK;

			$.each(fields, function(i, field) {

				var str = $.trim(field);

				// might be empty if the list eds with comma
				if (!str) {
					return true;
				}

				str = str.replace(/^\s*PRIMARY\s+KEY\s*\(\s*(.+?)\s*\)\s*$/i, function(all, key) {
					//f.primary = true;
					key = $.map(key.split(/\s*,\s*/), unQuote);
					key = key.length === 1 ? key[0] : key;

					if (PK && PK != key) {
						throw new Error("Invalid primary key declaration for table '" + name + "'");
					}

					PK = key;
					//console.log(key);
					return "";
				});
				if (!str) {
					return true;
				}

				var f = {
					name         : undefined,
					type         : undefined,
					nullable     : false,
					defaultValue : null,
					autoIncrement: false,
					unique       : false,
					primary      : false
				};

				str = str

				.replace(/\bPRIMARY\s+KEY\b/i, function(all, def) {
					if (PK) {
						throw new Error("Only one column can be used for primary key");
					}
					f.primary = true;
					return "";
				})
				.replace(/\bUNIQUE(\s+KEY)?\b/i, function(all, def) {
					f.unique = true;
					return "";
				})
				.replace(/\bAUTO_INCREMENT\b/i, function(all, def) {
					f.autoIncrement = true;
					return "";
				})
				.replace(/\b(NOT\s+NULL|NULL)\b/i, function(all) {
					f.nullable = all.toUpperCase() == "NULL";
					return "";
				})
				.replace(/\bDEFAULT\s+(.+?)\s*$/i, function(all, value) {
					f.defaultValue = unQuote(value);
					return "";
				})
				.replace(/^\s*(.+?)\s+/, function(all, name) {
					f.name = unQuote(name);
					if (f.primary) {
						PK = f.name;
					}
					return "";
				})
				.replace(/\s*(.+?)\s*$/, function(all, type) {
					type.replace(/^(.+?)\b/, function(name) {
						f.type = name.toUpperCase();
						return "";
					})
					.replace(/^\s*\(\s*(.+?)\s*\)/, function(name, args) {
						f.args = args.split(/\s*,\s*/);
						return "";
					})
					.replace(/^\s*(.+?)\s*$/, function(name, mods) {
						f.mods = mods.split(/\s+/);
						return "";
					});
					return "";
				});

				if (str) {
					console.warn("Unrecognized SQL:\n" + str);
				}

				//console.dir(f);
				
				tableFields[f.name] = f;
			});
			
			if (PK) {
				tableFields[PK].primary = true;
			}
			//console.dir(tableFields);
			createTable(name, tableFields, ifNotExists);
		}

		function parse__INSERT(sql, query) 
		{
			var match = sql.match(/^\s*(.*?)\s+\((.*?)\)\s+VALUES\s*\((.*?)\)\s*$/i);
			//console.log(match);
			if (!match) {
				throw new Error('Unrecognised statement "' + query.sql + '"');
			}

			var tableName = unQuote(match[1]);
			var table = CURRENT_DATABASE.tables[tableName];

			if (!table) {
				throw new Error('Table "' + tableName + '" does not exist');
			}

			
			var columns = $.map($.trim(match[2]).split(/\s*,\s*/), unQuote);
			var rows = $.trim(match[3]).split(/\s*\)\s*,\s*\(\s*/);
			$.each(rows, function(i, row) {
				var rec = {};
				var cells = row.split(/\s*,\s*/);
				
				$.each(table._fields, function(fieldName, field) {
					var value = null,
						colIndex = columns.indexOf(fieldName);
					if (colIndex > -1) {
						value = cells[colIndex];
						if (value === undefined) {
							value = field.defaultValue;
						}
					}

					if (value === null && field.autoIncrement) {
						value = table._ai;
					}

					if ((field.autoIncrement || field.primary) && (value in table.rows)) {
						throw new Error('Dublicate value for auto-increment or primary key field "' + tableName + '.' + fieldName + '"');
					}

					if (value === null && !field.nullable) {
						throw new Error('Field "' + tableName + '.' + fieldName + '" cannot be NULL');
					}
						
					switch (field.type) {
						case "VARCHAR":
						case "CHAR":
							if (typeof value != "string") {
								throw new Error('Invalid data type for "' + tableName + '.' + fieldName + '"');
							}
							rec[fieldName] = unQuote(value);
						break;
						case "INTEGER":
						case "INT":
							value = parseInt(value, 10);
							if (isNaN(value) || !isFinite(value)) {
								throw new Error('Invalid value for "' + tableName + '.' + fieldName + '"');
							}
							rec[fieldName] = value;
							
						break;
						case "FLOAT":
						case "REAL":
							value = parseFloat(value);
							if (isNaN(value) || !isFinite(value)) {
								throw new Error('Invalid value for "' + tableName + '.' + fieldName + '"');
							}
							rec[fieldName] = value;
						break;
						case "DATE":
							value = unQuote(value);
							var n = parseFloat(value);
							if (isNaN(n) || !isFinite(n)) {
								n = new Date(value);
							} else {
								n = new Date(n);
							}
							if (n.toString() == "Invalid Date") {
								throw new Error('Invalid value for "' + value + '" for "' + tableName + '.' + fieldName + '"');
							}
							//console.log(value)
							//value = new Date(value);console.log(value)
							rec[fieldName] = n.getTime();
						break;
						case "TIMESTAMP":
							var d = unQuote(value);
							value = new Date();
							Date.apply(value, d.split(/[\-\s\:]/));
							rec[fieldName] = value.getTime();
						break;
					}
				});

				/*$.each(columns, function(idx, colName) {
					var field = table._fields[colName];
					if (!field) {
						throw new Error('Table "' + tableName + '" has no column "' + colName + '"')
					}
					console.log(field);
					switch (field.type) {
						case "VARCHAR":
						case "CHAR":
							rec[colName] = unQuote(cells[idx]);
						break;
						case "INTEGER":
						case "INT":
							rec[colName] = parseInt(cells[idx], 10);
						break;
						case "FLOAT":
						case "REAL":
							rec[colName] = parseFloat(cells[idx]);
						break;
					}
				});*/
				//console.log(rec);
				table.insert(rec);
			});

			//console.log(tableName, columns, rows);
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

	// =========================================================================

	function Field(name, type, nullable, defaultValue)
	{
		this.name = name;
		this.type = type;
		this.nullable = !!nullable;
		this.defaultValue = defaultValue === undefined ? null : defaultValue;
	}

	// =========================================================================

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

	// =========================================================================

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

	// =========================================================================


	GLOBAL.JSDB.connect = function(dataPath)
	{
		return new DatabaseConnection(dataPath || "./");
	};

	GLOBAL.JSDB.query = function(sql, debug) 
	{
		return new SqlQuery(sql, debug).execute();
	};

	GLOBAL.JSDB.file     = executeSqlFile;
	GLOBAL.JSDB.tokenize = tokenize;

})(window, jQuery);