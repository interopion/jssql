/**
 * Note that the entire on-conflict clause is optional
 * 
 *  »» ══╦════════════════════════════════════════════════╦══ »» 
 *		 │                                                │                     
 *		 │  ┌────┐ ┌──────────┐         ┌────────────┐    │
 *		 └──┤ ON ├─┤ CONFLICT ├────┬────┤  ROLLBACK  ├────┤
 *		    └────┘ └──────────┘    │    └────────────┘    │
 *		                           │    ┌────────────┐    │
 *		                           ├────┤    ABORT   ├────┤
 *		                           │    └────────────┘    │
 *		                           │    ┌────────────┐    │
 *		                           ├────┤    FAIL    ├────┤
 *		                           │    └────────────┘    │
 *		                           │    ┌────────────┐    │
 *		                           ├────┤   IGNORE   ├────┤
 *		                           │    └────────────┘    │
 *		                           │    ┌────────────┐    │
 *		                           └────┤   REPLACE  ├────┘
 *		                                └────────────┘
 *
 */
Walker.prototype.walkOnConflictClause = function(callback)
{
	var onConflict = null, walker = this;

	walker.optional({
		"ON CONFLICT" : function() {
			walker.pick({
				"ROLLBACK|ABORT|FAIL|IGNORE|REPLACE" : function() {
					onConflict = this.prev()[0].toUpperCase();
				}
			});
		}
	});

	if (callback) 
		callback.call(walker, onConflict);

	return walker;
};