/**
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {void}
 */
STATEMENTS.CREATE_TABLE = function(walker) {
	
	// remember the table name here so that we can undo
	var tableName;

	function undo(done, fail) 
	{
		if (tableName) {
			var db = SERVER.getCurrentDatabase();
			if (db) {
				var table = db.tables[tableName];
				if (table) {
					fail("Droping tables is not fully implemented yet!");
				}
			}
			//SERVER.dropDatabase(dbName, true, done, fail);
			done();
		} else {
			done();
		}
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

	function walkIndexClause(index)
	{
		if (!index.name) {
			try {
				walker.someType(WORD_OR_STRING, function(token) {
					index.name = token[0];
				});
			} catch (ex) {}
		}

		walker.commaSeparatedBlock(function(token) {
			index.columns.push(token[0]);
		});
		walker.walkOnConflictClause(function(onConflict) {
			index.onConflict = onConflict;
		});
	}

	function walk_table_constraints(query) 
	{
		//console.log("walk_table_constraints");
		/*
		
	 »» ══╦══════════════════════════════════════════════════ »»
		  │  ┌───────────────────┐      
		  ├──┤        KEY        ├──┬──■ Indexed column list, ON CONFLICT
		  │  └───────────────────┘  │
		  │  ┌───────────────────┐  │
		  ├──┤       INDEX       ├──┤
		  │  └───────────────────┘  │
		  │  ┌─────────┐ ┌───────┐  │
		  ├──┤ PRIMARY ├─┤  KEY  ├──┤
		  │  └─────────┘ └───────┘  │
		  │  ┌───────────────────┐  │
		  ├──┤       UNIQUE      ├──┘
		  │  └───────────────────┘
		  │
		  │  ┌─────────┐ ┌───────┐
		  ├──┤ FOREIGN ├─┤  KEY  ├─────■ Indexed column list
		  │  └─────────┘ └───────┘
		  │  ┌─────────┐
		  └──┤  CHECK  ├───────────────■ Expression
		     └─────────┘

		*/
		var constraint = {};

		walker.optional("CONSTRAINT", function() {
			walker.someType(WORD_OR_STRING, function(token) {
				constraint.name = token[0];
			}, "for the name of the constraint");
		});
		
		walker.pick({
			"KEY|INDEX" : function() {
				constraint.type = TableIndex.TYPE_INDEX;
				constraint.columns = [];
				walkIndexClause(constraint);
			},
			"PRIMARY KEY" : function() {
				constraint.type = TableIndex.TYPE_PRIMARY;
				constraint.columns = [];
				walkIndexClause(constraint);
			},
			"UNIQUE" : function() {
				constraint.type = TableIndex.TYPE_UNIQUE;
				constraint.columns = [];
				walkIndexClause(constraint);
			},
			"CHECK" : function(token) {
				constraint.type = "CHECK";
			},
			"FOREIGN KEY" : function() {
				constraint.type = "FOREIGN KEY";
				constraint.columns = [];
				walker.commaSeparatedBlock(function(token) {
					constraint.columns.push(token[0]);
				});
			}
		});
		query.addConstraint(constraint);
		//console.log("constraint: ", constraint);

		walker.optional({
			"," : function() {
				walk_table_constraints(query);
			}
		});
	}
	
	function walk_createTableColumns(q)
	{
		var col = {};
		walker.someType(WORD_OR_STRING, function(token) {//console.log(token);
			if (token[1] === TOKEN_TYPE_WORD && 
				token[0].match(/^(CONSTRAINT|KEY|PRIMARY|UNIQUE|CHECK|FOREIGN)$/i)) 
			{
				if (!q.columns.length) {
					throw new SQLParseError(
						'You have to define some table columns bore defining ' +
						'a table constraint.'
					);
				}
				walker.back();
				walk_table_constraints(q);
			} else {
				col.name = token[0];
				walker.any(DATA_TYPES, function(token) {
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
							"KEY" : function() {
								col.key = "INDEX";
							},
							"INDEX" : function() {
								col.key = "INDEX";
							},
							"UNIQUE" : function() {
								walker.optional({ "KEY" : noop });
								col.key = "UNIQUE";
							},
							"PRIMARY KEY" : function() {
								col.key = "PRIMARY";
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
						q.columns.push(col);
					}
				});
			}
		});
	}
	
	return new Task({
		name : "Create Table",
		execute : function(done, fail) {
			var q = new CreateTableQuery();

			// Make sure to reset this in case it stores something from 
			// previous query
			tableName = null;

			q.temporary(walker.lookBack(2)[0].toUpperCase() == "TEMPORARY");
			
			walker
			.optional("IF NOT EXISTS", function() {
				q.ifNotExists(true);
			})
			.someType(WORD_OR_STRING, function(token) {
				q.name(token[0]);
				tableName = q.name();
			})
			.optional("(", function() {
				walk_createTableColumns(q);
			})
			.nextUntil(";")
			.commit(function() {
				//console.log("CreateTableQuery:");
				//console.dir(q);
				try {
					q.execute();
					done('Table "' + q.name() + '" created.');
				} catch (err) {
					fail(err);
				}
			});
		},
		undo : function(done, fail) {
			undo(done, fail);
		}
	});
};