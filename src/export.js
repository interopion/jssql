GLOBAL.JSDB = {
	query : query,
	Result: Result
};

if ( GLOBAL.JSDB_EXPORT_FOR_TESTING ) {
	mixin(GLOBAL.JSDB, {
		// Export these for testing
		TOKEN_TYPE_UNKNOWN             : TOKEN_TYPE_UNKNOWN,
		TOKEN_TYPE_WORD                : TOKEN_TYPE_WORD,
		TOKEN_TYPE_NUMBER              : TOKEN_TYPE_NUMBER,
		TOKEN_TYPE_OPERATOR            : TOKEN_TYPE_OPERATOR,
		TOKEN_TYPE_SINGLE_QUOTE_STRING : TOKEN_TYPE_SINGLE_QUOTE_STRING,
		TOKEN_TYPE_DOUBLE_QUOTE_STRING : TOKEN_TYPE_DOUBLE_QUOTE_STRING,
		TOKEN_TYPE_BACK_TICK_STRING    : TOKEN_TYPE_BACK_TICK_STRING,
		TOKEN_TYPE_SUBMIT              : TOKEN_TYPE_SUBMIT,
		TOKEN_TYPE_COMMENT             : TOKEN_TYPE_COMMENT,
		TOKEN_TYPE_MULTI_COMMENT       : TOKEN_TYPE_MULTI_COMMENT,
		TOKEN_TYPE_PUNCTOATOR          : TOKEN_TYPE_PUNCTOATOR,
		//TOKEN_TYPE_BLOCK_OPEN          : TOKEN_TYPE_BLOCK_OPEN,
		//TOKEN_TYPE_BLOCK_CLOSE         : TOKEN_TYPE_BLOCK_CLOSE,
		TOKEN_TYPE_SPACE               : TOKEN_TYPE_SPACE,
		TOKEN_TYPE_EOL                 : TOKEN_TYPE_EOL,
		TOKEN_TYPE_EOF                 : TOKEN_TYPE_EOF,

		tokenize         : tokenize,
		getTokens        : getTokens,
		Walker           : Walker,
		parse            : parse,
		Table            : Table,
		SERVER           : SERVER,
		Column           : Column,
		TableRow         : TableRow,
		//TableCell : TableCell,
		binarySearch     : binarySearch,
		BinaryTree       : BinaryTree,
		BinaryTreeNode   : BinaryTreeNode,
		crossJoin        : crossJoin,
		innerJoin        : innerJoin,
		crossJoin2       : crossJoin2,
		executeCondition : executeCondition
	});
}