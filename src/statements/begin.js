/** 
 * No changes can be made to the database except within a transaction. Any
 * command that changes the database (basically, any SQL command other than
 * SELECT) will automatically start a transaction if one is not already in
 * effect. Automatically started transactions are committed when the last query
 * finishes.
 * 
 * Transactions can be started manually using the BEGIN command. Such
 * transactions usually persist until the next COMMIT or ROLLBACK command. But a
 * transaction will also ROLLBACK if the database is closed or if an error occurs
 * and the ROLLBACK conflict resolution algorithm is specified. See the
 * documentation on the ON CONFLICT clause for additional information about the
 * ROLLBACK conflict resolution algorithm.
 * 
 * END TRANSACTION is an alias for COMMIT.
 * 
 * Transactions created using BEGIN...COMMIT do not nest. For nested
 * transactions, use the SAVEPOINT and RELEASE commands. The "TO SAVEPOINT name"
 * clause of the ROLLBACK command shown in the syntax diagram above is only
 * applicable to SAVEPOINT transactions. An attempt to invoke the BEGIN command
 * within a transaction will fail with an error, regardless of whether the
 * transaction was started by SAVEPOINT or a prior BEGIN. The COMMIT command and
 * the ROLLBACK command without the TO clause work the same on SAVEPOINT
 * transactions as they do with transactions started by BEGIN.
 * 
 * 
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {Function}
 * @example  * <pre style="font-family:Menlo, monospace">
 *
 *    ┌───────┐                        ┌─────────────┐  
 * >──┤ BEGIN ├──┬───────────────┬───┬─┤ TRANSACTION ├─┬──>
 *    └───────┘  │ ┌───────────┐ │   │ └─────────────┘ │
 *               ├─┤ DEFERRED  ├─┤   │                 │
 *               │ └───────────┘ │   └─────────────────┘
 *               │ ┌───────────┐ │
 *               ├─┤ IMEDDIATE ├─┤
 *               │ └───────────┘ │
 *               │ ┌───────────┐ │
 *               └─┤ EXCLUSIVE ├─┘
 *                 └───────────┘
 * </pre>
 */ 
STATEMENTS.BEGIN = function(walker) {
	return new Task({
		name : "Begin transaction",
		execute : function(done, fail) {
			
			var type = "DEFERRED";

			if ( walker.is("DEFERRED|IMEDDIATE|EXCLUSIVE") )
			{
				type = walker.get().toUpperCase();
				walker.forward();
			}

			if (walker.is("TRANSACTION"))
				walker.forward();
			
			walker.errorUntil(";");

			walker.commit(function() {
				SERVER.beginTransaction({ type : type });
				done("Transaction created");
			});
		},
		undo : function(done, fail) {
			SERVER.rollbackTransaction(done, fail);
		}
	});
};
