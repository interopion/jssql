/** 
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {Function}
 * @example  * <pre style="font-family:Menlo, monospace">
 *
 *       ┌────────┐         ┌─────────────┐  
 * >──┬──┤ COMMIT ├──┬───┬──┤ TRANSACTION ├──┬──>
 *    │  └────────┘  │   │  └─────────────┘  │
 *    │  ┌────────┐  │   │                   │
 *    └──┤  END   ├──┘   └───────────────────┘
 *       └────────┘
 * </pre>
 */ 
STATEMENTS.COMMIT = function(walker) {
	return new Task({
		name : "Commit transaction",
		execute : function(next) {
			if (walker.is("TRANSACTION"))
				walker.forward();
			
			walker.errorUntil(";");

			walker.commit(function() {
				walker.server.commitTransaction();
				next();
			});
		},
		undo : function(next) {
			walker.server.rollbackTransaction(next);
		}
	});
};
