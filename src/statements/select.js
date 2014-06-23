STATEMENTS.SELECT = function(walker) {

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
			table    : null
		};

		walker.someType(WORD_OR_STRING, function(token) {
			out.table = token[0];
		})
		.optional(".", function() {
			walker.someType(WORD_OR_STRING, function(token) {
				out.database = out.table;
				out.table    = token[0];
			});
		});

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
	function fieldRef() 
	{
		var out = {
			database : null, 
			table    : null,
			field    : null
		};

		walker.someType(WORD_OR_STRING, function(token) {
			out.field = token[0];
		})
		.optional(".", function() {
			walker.someType(WORD_OR_STRING, function(token) {
				out.table = out.field;
				out.field = token[0];
			})
			.optional(".", function() {
				walker.someType(WORD_OR_STRING, function(token) {
					out.database = out.table;
					out.table    = out.field;
					out.field    = token[0];
				});
			});
		});

		return out;
	}

	return function() {
		
		var tableName, dbName, table;
		
		walker.pick({
			"*|ALL" : function() {
				
				walker.pick({
					"FROM" : noop
				});
				
				// table -------------------------------------------------------
				var tbl   = tableRef(),
					table = getTable(tbl.table, tbl.database);
				
				walker.errorUntil(";")
				.commit(function() {
					//console.log(table);
					walker.onComplete({
						head : table._col_seq,
						rows : table.rows
					});
				});
			}
		});
	};
};