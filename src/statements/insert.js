/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.INSERT = function(walker) {
	var dbName, 
		tableName, 
		table,
		or, 
		valueSets = [], 
		columns;
	
	function columnsList(notFirst) {
		
		if (!notFirst) {
			columns = [];
		}
		
		walker.someType(WORD_OR_STRING, function(token) {
			columns.push(token[0]);
		})
		.pick({
			"," : function() {
				columnsList(true);
			},
			")" : noop
		});
	}
	
	function valueList(set) {
		walker.literalValue(function(token) {
			var value = token[0];
			if (token[1] === TOKEN_TYPE_WORD) {
				value = value.toUpperCase();
				if (value == "NULL") {
					value = null;
				}
			}
			set.push(value);
		})
		.optional({
			"," : function() {
				valueList(set);
			}
		});
	}
	
	function valueSet() {
		walker.pick({
			"(" : function() {
				var set = [];
				valueList(set);
				walker.pick({
					")" : function() {
						var cl = columns.length, 
							sl = set.length; 
						if (cl !== sl) {
							throw new SQLParseError(
								'The number of inserted values (%s) must ' + 
								'match the number of used columns (%s)',
								sl,
								cl
							);
						}
						valueSets.push(set);	
					}
				});
			}
		}).optional({
			"," : valueSet
		});
	}
	
	return function() {
		
		
		walker
		// TODO: with-clause
		
		// Type of insert ------------------------------------------------------
		.optional({ 
			"OR" : function() {
				walker.pick({
					"REPLACE"  : function() { or = "REPLACE" ; },
					"ROLLBACK" : function() { or = "ROLLBACK"; },
					"ABORT"    : function() { or = "ABORT"   ; },
					"FAIL"     : function() { or = "FAIL"    ; },
					"IGNORE"   : function() { or = "IGNORE"  ; },
				});
			}
		})
		
		.pick({ "INTO" : noop })
		
		// table ---------------------------------------------------------------
		.someType(WORD_OR_STRING, function(token) {
			tableName = token[0];
		})
		.optional(".", function() {
			walker.someType(WORD_OR_STRING, function(token) {
				dbName = tableName;
				tableName = token[0];
			});
		});
		
		table = getTable(tableName, dbName);
		columns = keys(table.cols);
		
		// Columns to be used --------------------------------------------------
		walker.optional({ "(" : columnsList })
		
		// Values to insert ----------------------------------------------------
		.pick({
			// TODO: Support for select statements here
			//"DEFAULT VALUES" : function() {
				// TODO
			//},
			"VALUES" : valueSet
		})
		
		// Finalize ------------------------------------------------------------
		.errorUntil(";")
		.commit(function() {
			/*console.dir({
				dbName    : dbName, 
				tableName : tableName, 
				table     : table,
				or        : or, 
				valueSets : valueSets,
				columns   : columns
			});*/
			table.insert(columns, valueSets);
			walker.onComplete(valueSets.length + ' rows inserted.');
		});
	};
};