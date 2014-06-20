Walker.prototype.walkIndexedColumn = function(callback)
{
	var col    = {},
		walker = this;

	this.someType(WORD_OR_STRING, function(token) {
		col.name = token[0];
	})
	.optional({
		"COLLATE" : function() {
			walker.someType(WORD_OR_STRING, function(token) {
				col.collation = token[0];
			});
		}
	})
	.optional({
		"ASC" : function() {
			col.sortOrder = "ASC";
		},
		"DESC" : function() {
			col.sortOrder = "DESC";
		}
	});

	if (callback) callback.call(this, col);
	return this;
};