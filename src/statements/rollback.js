/** 
 * @memberof STATEMENTS
 * @type {Function}
 * @param {Walker} walker - The walker instance used to parse the current 
 * statement
 * @return {Function}
 * @example  * <pre style="font-family:Menlo, monospace">
 *
 *       ┌──────────┐         ┌─────────────┐  
 * >─────┤ ROLLBACK ├──────┬──┤ TRANSACTION ├──┬────────>
 *       └──────────┘      │  └─────────────┘  │
 *                         │                   │
 *                         └───────────────────┘
 * 
 * </pre>
 */ 
STATEMENTS.ROLLBACK = function(walker) {
	return new Task({
		name : "Rollback transaction",
		execute : function(done, fail) {
			if (walker.is("TRANSACTION"))
				walker.forward();
			
			walker.errorUntil(";");

			walker.commit(function() {
				SERVER.rollbackTransaction();
				done();
			});
		},
		undo : function() {
			SERVER.commitTransaction();
			done();
		}
	});
};
